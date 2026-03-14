import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from db.models import Base

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest_asyncio.fixture(scope="function")
async def db_session():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async_session = sessionmaker(engine, class_=AsyncSession,
                                 expire_on_commit=False)
    async with async_session() as session:
        yield session
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import async_sessionmaker
from db.database import get_db

@pytest_asyncio.fixture(scope="function")
async def test_app():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    AsyncTestSession = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async def override_get_db():
        async with AsyncTestSession() as session:
            yield session

    from main import app
    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client

    app.dependency_overrides.clear()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


import fakeredis.aioredis
from unittest.mock import patch

@pytest.fixture(autouse=True)
def patch_redis_client():
    """
    Parchea redis_client globalmente en todos los tests para evitar
    conexiones reales a Redis (que no está corriendo en CI/test).
    Los fixtures que necesiten un fake_redis específico lo inyectan
    directamente via patch.object adicional.
    """
    from core import cache as cache_module
    fake = fakeredis.aioredis.FakeRedis(decode_responses=True)
    with patch.object(cache_module, "redis_client", fake):
        yield fake


@pytest_asyncio.fixture(scope="function")
async def fake_redis(patch_redis_client):
    """
    Redis falso para tests — devuelve la misma instancia que patch_redis_client
    ya instaló en core.cache.redis_client, garantizando que router y test
    comparten el mismo store.
    """
    yield patch_redis_client
    await patch_redis_client.aclose()


@pytest_asyncio.fixture(scope="function")
async def test_app_with_redis(fake_redis):
    """test_app con Redis falso inyectado."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    AsyncTestSession = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async def override_get_db():
        async with AsyncTestSession() as session:
            yield session

    from main import app
    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client

    app.dependency_overrides.clear()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()