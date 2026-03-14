"""
core/cache.py — Helper de caché Redis para CalcIng Math Engine.
Expone: make_cache_key, get_cached, set_cached, get_redis_client
"""
import hashlib
import json
from typing import Any

import redis.asyncio as aioredis

from core.config import settings

_redis_client: aioredis.Redis | None = None


def get_redis_client() -> aioredis.Redis:
    """
    Retorna el cliente Redis singleton.
    La conexión se crea en el primer uso, no al importar.
    """
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis_client


def make_cache_key(operation: str, *args: Any) -> str:
    """
    Genera una clave de caché determinista para una operación CAS.
    """
    raw = json.dumps({"op": operation, "args": list(args)}, sort_keys=True)
    digest = hashlib.sha256(raw.encode()).hexdigest()[:16]
    return f"calcIng:{operation}:{digest}"


async def get_cached(client: aioredis.Redis, key: str) -> dict | None:
    """
    Recupera un valor del caché. Retorna dict o None si no existe.
    """
    value = await client.get(key)
    if value is None:
        return None
    return json.loads(value)


async def set_cached(
    client: aioredis.Redis,
    key: str,
    payload: dict,
    ttl: int = settings.CACHE_TTL_SECONDS,
) -> None:
    """
    Guarda un valor en el caché con TTL en segundos.
    """
    await client.set(key, json.dumps(payload), ex=ttl)
# Alias p�blico requerido por tests
redis_client = get_redis_client
