import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr, Field, field_validator
from jose import JWTError

from db.database import get_db
from db.models import User
from core.config import settings
from core.limiter import limiter
from core.security import (
    hash_password, verify_password, dummy_verify,
    create_access_token, create_refresh_token,
    decode_refresh_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])

# Política de complejidad: requiere mayúscula, minúscula y dígito.
# No exigimos símbolos para no frustrar usuarios; mejor longitud larga + entropía mínima.
_PWD_LOWER = re.compile(r"[a-z]")
_PWD_UPPER = re.compile(r"[A-Z]")
_PWD_DIGIT = re.compile(r"\d")


def _validate_password_complexity(v: str) -> str:
    if len(v) < settings.PASSWORD_MIN_LENGTH:
        raise ValueError(
            f"Password must be at least {settings.PASSWORD_MIN_LENGTH} characters"
        )
    if len(v) > 128:
        # Límite duro: bcrypt trunca a 72 bytes pero rechazamos pre-hash para señalar el problema
        raise ValueError("Password must be at most 128 characters")
    if not _PWD_LOWER.search(v):
        raise ValueError("Password must contain at least one lowercase letter")
    if not _PWD_UPPER.search(v):
        raise ValueError("Password must contain at least one uppercase letter")
    if not _PWD_DIGIT.search(v):
        raise ValueError("Password must contain at least one digit")
    return v

# --- Schemas ---

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)

    @field_validator("password")
    @classmethod
    def password_complex(cls, v: str) -> str:
        return _validate_password_complexity(v)

class RegisterResponse(BaseModel):
    id: str
    email: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    first_name: str | None = None
    last_name: str | None = None
    plan: str = "free"

class RefreshRequest(BaseModel):
    refresh_token: str = Field(..., min_length=1, max_length=4096)

class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# --- Endpoints ---

@router.post("/register", response_model=RegisterResponse,
             status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute;20/hour")
async def register(request: Request,
                   body: RegisterRequest,
                   db: AsyncSession = Depends(get_db)) -> RegisterResponse:
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalars().first():
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        first_name=body.first_name,
        last_name=body.last_name,
        plan="free",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return RegisterResponse(id=str(user.id), email=user.email)

@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute;60/hour")
async def login(request: Request,
                body: LoginRequest,
                db: AsyncSession = Depends(get_db)) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalars().first()
    if not user:
        # Timing-safe: ejecutar bcrypt aunque no exista el usuario para que
        # un atacante no pueda enumerar emails midiendo latencias.
        dummy_verify(body.password)
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return TokenResponse(
        access_token=create_access_token(str(user.id), plan=user.plan),
        refresh_token=create_refresh_token(str(user.id)),
        first_name=user.first_name,
        last_name=user.last_name,
        plan=user.plan,
    )

@router.post("/refresh", response_model=AccessTokenResponse)
@limiter.limit("30/minute")
async def refresh(request: Request,
                  body: RefreshRequest,
                  db: AsyncSession = Depends(get_db)) -> AccessTokenResponse:
    try:
        subject = decode_refresh_token(body.refresh_token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    try:
        subject_uuid = uuid.UUID(subject)
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid token subject")
    result = await db.execute(select(User).where(User.id == subject_uuid))
    user = result.scalars().first()
    plan = user.plan if user else "free"
    return AccessTokenResponse(access_token=create_access_token(subject, plan=plan))