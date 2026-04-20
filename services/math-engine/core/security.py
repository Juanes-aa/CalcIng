from datetime import datetime, timedelta, timezone
from typing import Any
from jose import jwt, JWTError
from passlib.context import CryptContext
from core.keys import get_private_key, get_public_key

ALGORITHM = "RS256"
ACCESS_TOKEN_TTL_MINUTES = 60
REFRESH_TOKEN_TTL_DAYS = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(subject: str, plan: str = "free") -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_TTL_MINUTES
    )
    payload: dict[str, Any] = {
        "sub": subject,
        "exp": expire,
        "type": "access",
        "plan": plan,
    }
    return jwt.encode(payload, get_private_key(), algorithm=ALGORITHM)

def create_refresh_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        days=REFRESH_TOKEN_TTL_DAYS
    )
    payload: dict[str, Any] = {
        "sub": subject,
        "exp": expire,
        "type": "refresh",
    }
    return jwt.encode(payload, get_private_key(), algorithm=ALGORITHM)

def decode_refresh_token(token: str) -> str:
    """Decodifica refresh token y retorna el subject (user_id).
    Lanza JWTError si el token es inválido o expirado."""
    payload = jwt.decode(token, get_public_key(), algorithms=[ALGORITHM])
    if payload.get("type") != "refresh":
        raise JWTError("Not a refresh token")
    sub = payload.get("sub")
    if not sub:
        raise JWTError("Missing subject")
    return sub