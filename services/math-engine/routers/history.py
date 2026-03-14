from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
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

@router.get("/history", response_model=HistoryResponse)
async def get_history(
    limit: int = Query(default=20, ge=1, le=100),
    cursor: Optional[str] = Query(default=None),
    user_id: str = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
) -> HistoryResponse:
    import uuid
    query = (
        select(Problem)
        .where(Problem.user_id == uuid.UUID(user_id))
        .order_by(Problem.created_at.desc())
    )
    if cursor:
        cursor_dt = datetime.fromisoformat(cursor)
        query = query.where(Problem.created_at < cursor_dt)

    query = query.limit(limit + 1)
    result = await db.execute(query)
    problems = result.scalars().all()

    has_more = len(problems) > limit
    items = problems[:limit]

    next_cursor: str | None = None
    if has_more:
        next_cursor = items[-1].created_at.isoformat()

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