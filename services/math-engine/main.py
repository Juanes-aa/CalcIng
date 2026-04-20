from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from core.config import settings
from core.limiter import limiter
from routers.math import router
from routers.auth import router as auth_router
from routers.history import router as history_router
from routers.premium import router as premium_router

limiter.enabled = settings.APP_ENV != "testing"
limiter._default_limits = [f"{settings.RATE_LIMIT_PER_MINUTE}/minute"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    from core.cache import redis_client
    await redis_client.aclose()


app = FastAPI(title="CalcIng Math Engine", version="1.0.0", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(auth_router)
app.include_router(history_router)
app.include_router(premium_router)