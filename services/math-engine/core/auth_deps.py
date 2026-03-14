from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from core.security import ALGORITHM
from core.keys import get_public_key
from jose import jwt

bearer_scheme = HTTPBearer(auto_error=False)

async def require_auth(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    """Valida JWT RS256 y retorna user_id (sub).
    Retorna 401 si falta el token, es inválido, o es un refresh token."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization token",
        )
    try:
        payload = jwt.decode(
            credentials.credentials,
            get_public_key(),
            algorithms=[ALGORITHM],
        )
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )
        return user_id
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

async def optional_auth(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str | None:
    """Como require_auth pero retorna None si no hay token.
    Usado en endpoints que funcionan con o sin autenticación."""
    if credentials is None:
        return None
    try:
        payload = jwt.decode(
            credentials.credentials,
            get_public_key(),
            algorithms=[ALGORITHM],
        )
        if payload.get("type") != "access":
            return None
        return payload.get("sub")
    except JWTError:
        return None