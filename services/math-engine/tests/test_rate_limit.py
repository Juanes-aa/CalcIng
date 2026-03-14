import pytest
from httpx import AsyncClient, ASGITransport
from fastapi import FastAPI, Request
from slowapi.errors import RateLimitExceeded


def make_test_app(enabled: bool = True):
    from slowapi.middleware import SlowAPIMiddleware
    from fastapi.responses import JSONResponse
    from limits.storage import MemoryStorage
    import routers.math as math_module

    original_limiter = math_module.limiter
    original_enabled = original_limiter.enabled
    original_storage = original_limiter._limiter.storage

    # Aplicar inmediatamente (NO usar lifespan para esto)
    fresh_storage = MemoryStorage()
    original_limiter.enabled = enabled
    original_limiter._limiter.storage = fresh_storage

    async def custom_rate_limit_handler(
        request: Request, exc: RateLimitExceeded
    ) -> JSONResponse:
        retry_after = str(getattr(exc, "retry_after", 60))
        return JSONResponse(
            status_code=429,
            content={"error": "Rate limit exceeded", "detail": str(exc)},
            headers={"Retry-After": retry_after},
        )

    from routers.math import router

    app = FastAPI()
    app.state.limiter = original_limiter
    app.add_exception_handler(RateLimitExceeded, custom_rate_limit_handler)
    app.add_middleware(SlowAPIMiddleware)
    app.include_router(router)

    return app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
def limiter_restore():
    import routers.math as math_module

    original_enabled = math_module.limiter.enabled
    original_storage = math_module.limiter._limiter.storage

    yield

    math_module.limiter.enabled = original_enabled
    math_module.limiter._limiter.storage = original_storage


@pytest.mark.anyio
async def test_solve_rate_limit_returns_429_after_limit(limiter_restore):
    app = make_test_app()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        responses = []
        for _ in range(35):
            r = await ac.post("/solve", json={"expression": "1+1", "options": {}})
            responses.append(r.status_code)
        assert 429 in responses, f"No 429 en 35 intentos. Codes: {responses}"


@pytest.mark.anyio
async def test_differentiate_rate_limit_returns_429_after_limit(limiter_restore):
    app = make_test_app()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        responses = []
        for _ in range(35):
            r = await ac.post(
                "/differentiate",
                json={"expression": "x**2", "variable": "x", "order": 1},
            )
            responses.append(r.status_code)
        assert 429 in responses, f"No 429 en 35 intentos. Codes: {responses}"


@pytest.mark.anyio
async def test_integrate_rate_limit_returns_429_after_limit(limiter_restore):
    app = make_test_app()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        responses = []
        for _ in range(35):
            r = await ac.post(
                "/integrate",
                json={"expression": "x**2", "variable": "x"},
            )
            responses.append(r.status_code)
        assert 429 in responses, f"No 429 en 35 intentos. Codes: {responses}"


@pytest.mark.anyio
async def test_health_not_rate_limited(limiter_restore):
    app = make_test_app()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        for _ in range(40):
            r = await ac.get("/health")
            assert r.status_code == 200


@pytest.mark.anyio
async def test_rate_limit_response_has_retry_after_header(limiter_restore):
    app = make_test_app()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        responses = []
        for _ in range(35):
            r = await ac.post("/solve", json={"expression": "1+1", "options": {}})
            responses.append(r)

        blocked = [r for r in responses if r.status_code == 429]
        assert len(blocked) > 0, "Ningún request fue bloqueado"

        headers_lower = {k.lower(): v for k, v in blocked[0].headers.items()}
        assert "retry-after" in headers_lower, (
            f"Sin Retry-After. Headers: {dict(blocked[0].headers)}"
        )


@pytest.mark.anyio
async def test_rate_limit_disabled_in_testing_env(limiter_restore):
    app = make_test_app(enabled=False)
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        for _ in range(40):
            r = await ac.post("/solve", json={"expression": "1+1", "options": {}})
            assert r.status_code == 200