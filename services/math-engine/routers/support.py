import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field, field_validator

from db.database import get_db
from db.models import SupportTicket
from core.auth_deps import optional_auth
from core.limiter import limiter

router = APIRouter(prefix="/support", tags=["support"])

# --- Schemas ---

class TicketCreate(BaseModel):
    """Ticket de soporte. Longitudes acotadas para prevenir abuso de almacenamiento."""
    full_name: str = Field(..., min_length=1, max_length=200)
    eng_id: str = Field(default="", max_length=100)
    category: str = Field(..., min_length=1, max_length=50)
    description: str = Field(..., min_length=1, max_length=5000)
    critical: bool = False

class TicketOut(BaseModel):
    id: str
    full_name: str
    eng_id: str
    category: str
    description: str
    critical: bool
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}

# --- Endpoints ---

@router.post("", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
# Anti-spam: el endpoint acepta requests anónimas; limitamos por IP + por usuario.
@limiter.limit("5/hour;20/day")
async def submit_ticket(
    request: Request,
    body: TicketCreate,
    user_id: str | None = Depends(optional_auth),
    db: AsyncSession = Depends(get_db),
) -> TicketOut:
    ticket = SupportTicket(
        user_id=uuid.UUID(user_id) if user_id else None,
        full_name=body.full_name.strip(),
        eng_id=body.eng_id.strip(),
        category=body.category.strip(),
        description=body.description.strip(),
        critical=body.critical,
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return TicketOut(
        id=str(ticket.id),
        full_name=ticket.full_name,
        eng_id=ticket.eng_id,
        category=ticket.category,
        description=ticket.description,
        critical=ticket.critical,
        status=ticket.status,
        created_at=ticket.created_at,
    )
