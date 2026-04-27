from datetime import datetime, timedelta, timezone
from typing import Any
from jose import jwt, JWTError
from passlib.context import CryptContext
from core.keys import get_private_key, get_public_key

ALGORITHM = "RS256"
# Acortado de 60 → 15 min: limita ventana de uso si un access token es robado.
# Refresh sigue siendo 30 días para no degradar UX.
ACCESS_TOKEN_TTL_MINUTES = 15
REFRESH_TOKEN_TTL_DAYS = 30

# bcrypt con cost 12 (default). En producción >=12 es estándar OWASP 2024.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

# Hash precomputado de un password dummy para verificación timing-safe en login
# cuando el usuario NO existe (evita user enumeration por diferencia de tiempos).
_DUMMY_HASH = pwd_context.hash("dummy-password-for-timing-safety")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def dummy_verify(plain: str) -> None:
    """Ejecuta una verificación bcrypt contra un hash dummy.

    Se usa cuando el email no existe en login para que el tiempo de respuesta
    sea indistinguible del caso "usuario existe pero password incorrecto".
    Mitiga ataques de enumeración de usuarios por timing.
    """
    pwd_context.verify(plain, _DUMMY_HASH)


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