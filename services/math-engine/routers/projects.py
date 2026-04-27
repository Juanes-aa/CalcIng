import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json as _json

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Any

_MAX_DATA_BYTES = 32768  # 32 KiB por proyecto en el campo JSONB

from db.database import get_db
from db.models import Project
from core.auth_deps import require_auth

router = APIRouter(prefix="/projects", tags=["projects"])

# --- Schemas ---

def _validate_data_size(v: Any) -> Any:
    """Rechaza dicts que serializados a JSON excedan el límite (DoS prevention)."""
    if v is None:
        return v
    try:
        size = len(_json.dumps(v).encode("utf-8"))
    except (TypeError, ValueError):
        raise ValueError("data debe ser JSON-serializable")
    if size > _MAX_DATA_BYTES:
        raise ValueError(f"data excede el límite de {_MAX_DATA_BYTES} bytes")
    return v


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)

class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    data: Optional[dict] = None

    @field_validator("data")
    @classmethod
    def _check_data(cls, v: Optional[dict]) -> Optional[dict]:
        return _validate_data_size(v)

class ProjectOut(BaseModel):
    id: str
    name: str
    description: str
    data: dict
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class ProjectListResponse(BaseModel):
    items: list[ProjectOut]

# --- Endpoints ---

@router.get("", response_model=ProjectListResponse)
async def list_projects(
    user_id: str = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
) -> ProjectListResponse:
    query = (
        select(Project)
        .where(Project.user_id == uuid.UUID(user_id))
        .order_by(Project.updated_at.desc())
    )
    result = await db.execute(query)
    projects = result.scalars().all()
    return ProjectListResponse(
        items=[
            ProjectOut(
                id=str(p.id),
                name=p.name,
                description=p.description,
                data=p.data,
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
            for p in projects
        ]
    )

@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: ProjectCreate,
    user_id: str = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
) -> ProjectOut:
    if not body.name.strip():
        raise HTTPException(status_code=422, detail="Project name cannot be empty")
    project = Project(
        user_id=uuid.UUID(user_id),
        name=body.name.strip(),
        description=body.description.strip(),
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return ProjectOut(
        id=str(project.id),
        name=project.name,
        description=project.description,
        data=project.data,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )

@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(
    project_id: str,
    user_id: str = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
) -> ProjectOut:
    result = await db.execute(
        select(Project).where(
            Project.id == uuid.UUID(project_id),
            Project.user_id == uuid.UUID(user_id),
        )
    )
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectOut(
        id=str(project.id),
        name=project.name,
        description=project.description,
        data=project.data,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )

@router.patch("/{project_id}", response_model=ProjectOut)
async def update_project(
    project_id: str,
    body: ProjectUpdate,
    user_id: str = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
) -> ProjectOut:
    result = await db.execute(
        select(Project).where(
            Project.id == uuid.UUID(project_id),
            Project.user_id == uuid.UUID(user_id),
        )
    )
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if body.name is not None:
        if not body.name.strip():
            raise HTTPException(status_code=422, detail="Project name cannot be empty")
        project.name = body.name.strip()
    if body.description is not None:
        project.description = body.description.strip()
    if body.data is not None:
        project.data = body.data
    await db.commit()
    await db.refresh(project)
    return ProjectOut(
        id=str(project.id),
        name=project.name,
        description=project.description,
        data=project.data,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    user_id: str = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(
        select(Project).where(
            Project.id == uuid.UUID(project_id),
            Project.user_id == uuid.UUID(user_id),
        )
    )
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.delete(project)
    await db.commit()
