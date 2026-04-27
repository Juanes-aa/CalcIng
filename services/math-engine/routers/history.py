import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from db.database import get_db
from db.models import Problem
from core.auth_deps import require_auth

router = APIRouter(prefix="/users/me", tags=["history"])


class ProblemOut(BaseModel):
    id: str
    expression: str
    result: str
    type: str
    created_at: datetime

    model_config = {"from_attributes": True}


class HistoryResponse(BaseModel):
    items: list[ProblemOut]
    next_cursor: Optional[str]


def _parse_cursor(cursor: str) -> tuple[datetime, uuid.UUID | None]:
    """Parsea un cursor con formato '{iso_timestamp}_{uuid}' (nuevo)
    o sólo '{iso_timestamp}' (legacy, sin desempate por id)."""
    if "_" in cursor:
        ts_part, id_part = cursor.rsplit("_", 1)
        try:
            return datetime.fromisoformat(ts_part), uuid.UUID(id_part)
        except (ValueError, TypeError):
            return datetime.fromisoformat(cursor), None
    return datetime.fromisoformat(cursor), None


@router.get("/history", response_model=HistoryResponse)
async def get_history(
    limit: int = Query(default=20, ge=1, le=100),
    cursor: Optional[str] = Query(default=None),
    user_id: str = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
) -> HistoryResponse:
    # Orden estable: (created_at DESC, id DESC) — id desempata timestamps duplicados.
    query = (
        select(Problem)
        .where(Problem.user_id == uuid.UUID(user_id))
        .order_by(Problem.created_at.desc(), Problem.id.desc())
    )
    if cursor:
        cursor_dt, cursor_id = _parse_cursor(cursor)
        if cursor_id is not None:
            # (created_at, id) < (cursor_dt, cursor_id) en orden DESC.
            query = query.where(
                or_(
                    Problem.created_at < cursor_dt,
                    and_(Problem.created_at == cursor_dt, Problem.id < cursor_id),
                )
            )
        else:
            query = query.where(Problem.created_at < cursor_dt)

    query = query.limit(limit + 1)
    result = await db.execute(query)
    problems = result.scalars().all()

    has_more = len(problems) > limit
    items = problems[:limit]

    next_cursor: str | None = None
    if has_more:
        last = items[-1]
        next_cursor = f"{last.created_at.isoformat()}_{last.id}"

    return HistoryResponse(
        items=[
            ProblemOut(
                id=str(p.id),
                expression=p.expression,
                result=p.result,
                type=p.type,
                created_at=p.created_at,
            )
            for p in items
        ],
        next_cursor=next_cursor,
    )