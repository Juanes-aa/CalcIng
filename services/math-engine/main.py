import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from core.config import settings
from core.limiter import limiter
from core.middleware import SecurityHeadersMiddleware, BodySizeLimitMiddleware
from routers.math import router
from routers.auth import router as auth_router
from routers.history import router as history_router
from routers.premium import router as premium_router
from routers.billing import router as billing_router
from routers.projects import router as projects_router
from routers.support import router as support_router

# Logging básico — los routers usan loggers propios; aquí configuramos el formato.
logging.basicConfig(
    level=logging.INFO if settings.APP_ENV == "production" else logging.DEBUG,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

limiter.enabled = settings.APP_ENV != "testing"
limiter._default_limits = [f"{settings.RATE_LIMIT_PER_MINUTE}/minute"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    from core.cache import redis_client
    await redis_client.aclose()


# `docs_url` y `redoc_url` deshabilitados en producción para reducir superficie
# (no exponer schema interno a anónimos). En dev/test siguen disponibles.
_is_prod = settings.APP_ENV == "production"
app = FastAPI(
    title="CalcIng Math Engine",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None if _is_prod else "/docs",
    redoc_url=None if _is_prod else "/redoc",
    openapi_url=None if _is_prod else "/openapi.json",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# === Middlewares (orden importa: el último agregado es el primero en ejecutarse) ===
# Inyectamos los middlewares en orden inverso al deseado de ejecución.

# 1. (último en ejecutarse) Headers de seguridad sobre la respuesta final
app.add_middleware(SecurityHeadersMiddleware, hsts=_is_prod)

# 2. CORS — orígenes EXPLÍCITOS, métodos/headers acotados, sin regex localhost en prod
_localhost_regex = (
    r"http://(localhost|127\.0\.0\.1)(:\d+)?" if not _is_prod else None
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=_localhost_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Signature", "X-Request-Id"],
    expose_headers=["Retry-After"],
    max_age=600,
)

# 3. Trusted hosts — bloquea ataques Host-header en producción
if _is_prod:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.TRUSTED_HOSTS)

# 4. SlowAPI — necesario para que `_default_limits` y los `@limiter.limit` funcionen
app.add_middleware(SlowAPIMiddleware)

# 5. (primero en ejecutarse) Body-size limit — corta payloads gigantes antes de Pydantic
app.add_middleware(BodySizeLimitMiddleware, max_bytes=settings.MAX_REQUEST_BODY_BYTES)

app.include_router(router)
app.include_router(auth_router)
app.include_router(history_router)
app.include_router(premium_router)
app.include_router(billing_router)
app.include_router(projects_router)
app.include_router(support_router)