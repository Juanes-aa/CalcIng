"""
core/middleware.py — Middlewares de seguridad para CalcIng Math Engine.

Aplica defensa en profundidad a nivel HTTP:
- Headers de seguridad (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
  HSTS en producción, Permissions-Policy).
- Límite de tamaño de body para prevenir DoS por payloads gigantes.

CSRF no se incluye porque la API es stateless con Authorization: Bearer (sin cookies
de sesión). El navegador no adjunta el token automáticamente, por lo que CSRF
clásico no aplica.
"""
from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from starlette.types import ASGIApp


# Headers aplicados a TODA respuesta. Valores conservadores que no rompen una API JSON.
# CSP es restrictivo porque este servicio sólo devuelve JSON / PNG base64; nunca HTML.
_SECURITY_HEADERS: dict[str, str] = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-site",
    # CSP estricto: este backend nunca sirve HTML; bloquear todo por defecto.
    "Content-Security-Policy": (
        "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
    ),
}


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Inyecta headers de seguridad en cada respuesta."""

    def __init__(self, app: ASGIApp, hsts: bool = False) -> None:
        super().__init__(app)
        self._hsts = hsts

    async def dispatch(self, request: Request, call_next):  # type: ignore[override]
        response: Response = await call_next(request)
        for k, v in _SECURITY_HEADERS.items():
            response.headers.setdefault(k, v)
        if self._hsts:
            response.headers.setdefault(
                "Strict-Transport-Security",
                "max-age=63072000; includeSubDomains; preload",
            )
        # Evitar caches intermedios sobre respuestas autenticadas
        if request.headers.get("authorization"):
            response.headers.setdefault("Cache-Control", "no-store")
        return response


class BodySizeLimitMiddleware(BaseHTTPMiddleware):
    """Rechaza requests cuyo Content-Length excede el límite configurado.

    Bloquea ataques de DoS por payloads gigantes antes de que FastAPI/Pydantic
    siquiera intenten parsearlos. Si Content-Length no está presente, lee el
    body acotado y rechaza si supera el límite.
    """

    def __init__(self, app: ASGIApp, max_bytes: int) -> None:
        super().__init__(app)
        self._max_bytes = max_bytes

    async def dispatch(self, request: Request, call_next):  # type: ignore[override]
        cl = request.headers.get("content-length")
        if cl is not None:
            try:
                if int(cl) > self._max_bytes:
                    return JSONResponse(
                        status_code=413,
                        content={"detail": "Request body too large"},
                    )
            except ValueError:
                return JSONResponse(
                    status_code=400, content={"detail": "Invalid Content-Length"}
                )
        return await call_next(request)
