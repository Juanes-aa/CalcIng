"""
Tests para Backend-4 Sub-fase 2 — Redis caché + rate limiting.
Todos deben fallar (rojo) hasta que se implemente core/cache.py y se integre.
"""
import pytest


class TestSettingsRedis:

    def test_redis_url_field_exists(self):
        from core.config import settings
        assert hasattr(settings, "REDIS_URL")

    def test_redis_url_default(self):
        from core.config import settings
        assert settings.REDIS_URL == "redis://localhost:6379"

    def test_cache_ttl_field_exists(self):
        from core.config import settings
        assert hasattr(settings, "CACHE_TTL_SECONDS")

    def test_cache_ttl_default(self):
        from core.config import settings
        assert settings.CACHE_TTL_SECONDS == 3600

    def test_rate_limit_field_exists(self):
        from core.config import settings
        assert hasattr(settings, "RATE_LIMIT_PER_MINUTE")

    def test_rate_limit_default(self):
        from core.config import settings
        assert settings.RATE_LIMIT_PER_MINUTE == 60


class TestCacheModule:

    def test_cache_module_importable(self):
        from core import cache  # noqa: F401

    def test_cache_key_fn_exists(self):
        from core.cache import make_cache_key
        assert callable(make_cache_key)

    def test_cache_key_is_deterministic(self):
        from core.cache import make_cache_key
        k1 = make_cache_key("differentiate", "x^2", "x", 1)
        k2 = make_cache_key("differentiate", "x^2", "x", 1)
        assert k1 == k2

    def test_cache_key_differs_by_operation(self):
        from core.cache import make_cache_key
        k1 = make_cache_key("differentiate", "x^2", "x", 1)
        k2 = make_cache_key("integrate", "x^2", "x", 1)
        assert k1 != k2

    def test_cache_key_differs_by_expression(self):
        from core.cache import make_cache_key
        k1 = make_cache_key("differentiate", "x^2", "x", 1)
        k2 = make_cache_key("differentiate", "x^3", "x", 1)
        assert k1 != k2

    def test_redis_client_attribute_exists(self):
        from core import cache
        assert hasattr(cache, "redis_client")

    def test_get_cached_fn_exists(self):
        from core.cache import get_cached
        assert callable(get_cached)

    def test_set_cached_fn_exists(self):
        from core.cache import set_cached
        assert callable(set_cached)


class TestCacheFunctionality:

    @pytest.mark.asyncio
    async def test_get_cached_miss_returns_none(self, fake_redis):
        from core.cache import get_cached
        result = await get_cached(fake_redis, "nonexistent_key")
        assert result is None

    @pytest.mark.asyncio
    async def test_set_and_get_cached(self, fake_redis):
        from core.cache import get_cached, set_cached
        payload = {"result": "2*x", "steps": ["paso 1"]}
        await set_cached(fake_redis, "test_key", payload, ttl=60)
        result = await get_cached(fake_redis, "test_key")
        assert result == payload

    @pytest.mark.asyncio
    async def test_set_cached_serializes_correctly(self, fake_redis):
        from core.cache import get_cached, set_cached
        payload = {"result": "cos(x)", "steps": []}
        await set_cached(fake_redis, "key_serial", payload, ttl=60)
        result = await get_cached(fake_redis, "key_serial")
        assert isinstance(result, dict)
        assert result["result"] == "cos(x)"

    @pytest.mark.asyncio
    async def test_cached_key_expires(self, fake_redis):
        from core.cache import get_cached, set_cached
        await set_cached(fake_redis, "expire_key", {"r": "1"}, ttl=1)
        await fake_redis.expire("expire_key", 0)
        result = await get_cached(fake_redis, "expire_key")
        assert result is None


class TestCacheIntegration:

    @pytest.mark.asyncio
    async def test_differentiate_populates_cache(self, test_app_with_redis, fake_redis):
        from core.cache import make_cache_key, get_cached
        payload = {"expression": "x**2", "variable": "x", "order": 1}
        response = await test_app_with_redis.post("/differentiate", json=payload)
        assert response.status_code == 200
        key = make_cache_key("differentiate", "x**2", "x", 1)
        cached = await get_cached(fake_redis, key)
        assert cached is not None

    @pytest.mark.asyncio
    async def test_differentiate_returns_cached_result(self, test_app_with_redis, fake_redis):
        from core.cache import make_cache_key, set_cached
        key = make_cache_key("differentiate", "x**3", "x", 1)
        cached_payload = {"result": "CACHED_VALUE", "steps": ["desde caché"]}
        await set_cached(fake_redis, key, cached_payload, ttl=3600)
        payload = {"expression": "x**3", "variable": "x", "order": 1}
        response = await test_app_with_redis.post("/differentiate", json=payload)
        assert response.status_code == 200
        assert response.json()["result"] == "CACHED_VALUE"

    @pytest.mark.asyncio
    async def test_integrate_populates_cache(self, test_app_with_redis, fake_redis):
        from core.cache import make_cache_key, get_cached
        payload = {"expression": "x**2", "variable": "x"}
        response = await test_app_with_redis.post("/integrate", json=payload)
        assert response.status_code == 200
        key = make_cache_key("integrate", "x**2", "x")
        cached = await get_cached(fake_redis, key)
        assert cached is not None

    @pytest.mark.asyncio
    async def test_solve_equation_populates_cache(self, test_app_with_redis, fake_redis):
        from core.cache import make_cache_key, get_cached
        payload = {"equation": "x**2 - 4", "variable": "x"}
        response = await test_app_with_redis.post("/solve-equation", json=payload)
        assert response.status_code == 200
        key = make_cache_key("solve-equation", "x**2 - 4", "x")
        cached = await get_cached(fake_redis, key)
        assert cached is not None


class TestRateLimiting:

    def test_slowapi_limiter_in_app_state(self):
        from main import app
        assert hasattr(app.state, "limiter"), \
            "app.state debe tener 'limiter' (slowapi)"

    def test_rate_limit_uses_settings(self):
        from core.config import settings
        assert isinstance(settings.RATE_LIMIT_PER_MINUTE, int)
        assert settings.RATE_LIMIT_PER_MINUTE > 0