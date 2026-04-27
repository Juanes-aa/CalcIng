import os

# Asegurar APP_ENV=testing ANTES de cualquier import del proyecto que cargue
# core.config. pytest.ini lo declara en la sección `env =` pero eso requiere
# pytest-env (no listado en requirements.txt). Esta línea garantiza que el
# rate-limiter de SlowAPI quede deshabilitado durante la suite.
os.environ.setdefault("APP_ENV", "testing")
os.environ.setdefault("RATELIMIT_STORAGE_URL", "memory://")

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
    Parchea get_redis_client globalmente en todos los tests para evitar
    conexiones reales a Redis (que no está corriendo en CI/test).
    """
    from core import cache as cache_module
    fake = fakeredis.aioredis.FakeRedis(decode_responses=True)
    with patch.object(cache_module, "get_redis_client", return_value=fake):
        yield fake


@pytest_asyncio.fixture(scope="function")
async def fake_redis(patch_redis_client):
    """
    Redis falso para tests — devuelve la misma instancia que patch_redis_client
    ya instaló en core.cache.get_redis_client, garantizando que router y test
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