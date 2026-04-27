"""
core/mercadopago_client.py — Cliente Mercado Pago configurado desde settings.

Provee:
- get_mp_sdk(): instancia del SDK oficial mercadopago configurada con MP_ACCESS_TOKEN.
- verify_mp_signature(): valida HMAC-SHA256 del header `x-signature` enviado
  por las notificaciones de webhook de MP.
- PLAN_TO_TIER: mapeo plan_id → tier ("pro" | "enterprise").
"""
from __future__ import annotations

import hashlib
import hmac
from typing import Any

import mercadopago

from core.config import settings


def get_mp_sdk() -> mercadopago.SDK:
    """Retorna una instancia del SDK de Mercado Pago.

    Se construye en cada llamada (no se cachea) para que los tests puedan
    monkeypatchear la función fácilmente con `patch("routers.billing.get_mp_sdk")`.
    """
    return mercadopago.SDK(settings.MP_ACCESS_TOKEN)


def verify_mp_signature(
    signature_header: str,
    request_id: str,
    data_id: str,
    secret: str | None = None,
) -> bool:
    """Valida la firma HMAC-SHA256 enviada por MP en el header `x-signature`.

    El header tiene formato: `ts=<timestamp>,v1=<hash>`.
    El manifest a firmar es: `id:<data_id>;request-id:<request_id>;ts:<ts>;`.

    Args:
        signature_header: contenido crudo del header `x-signature`.
        request_id: contenido del header `x-request-id`.
        data_id: id del recurso (viene en `body["data"]["id"]`).
        secret: clave secreta. Si es None, usa settings.MP_WEBHOOK_SECRET.

    Returns:
        True si la firma es válida, False en caso contrario.
    """
    secret_value = secret if secret is not None else settings.MP_WEBHOOK_SECRET
    if not secret_value or not signature_header or not request_id or not data_id:
        return False

    parts: dict[str, str] = {}
    for part in signature_header.split(","):
        if "=" not in part:
            continue
        k, v = part.strip().split("=", 1)
        parts[k.strip()] = v.strip()

    ts = parts.get("ts", "")
    received_hash = parts.get("v1", "")
    if not ts or not received_hash:
        return False

    manifest = f"id:{data_id};request-id:{request_id};ts:{ts};"
    expected = hmac.new(
        secret_value.encode("utf-8"),
        manifest.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, received_hash)


def build_plan_to_tier_map() -> dict[str, str]:
    """Construye el mapeo plan_id → tier desde settings.

    Solo incluye plan_ids no vacíos. Se llama on-demand para que los tests
    puedan inyectar entradas adicionales (ver routers/billing.py).
    """
    mapping: dict[str, str] = {}
    pairs: list[tuple[str, str]] = [
        (settings.MP_PLAN_PRO_MONTHLY, "pro"),
        (settings.MP_PLAN_PRO_ANNUAL, "pro"),
        (settings.MP_PLAN_ENTERPRISE_MONTHLY, "enterprise"),
        (settings.MP_PLAN_ENTERPRISE_ANNUAL, "enterprise"),
    ]
    for plan_id, tier in pairs:
        if plan_id:
            mapping[plan_id] = tier
    return mapping


def extract_response_body(mp_response: Any) -> dict[str, Any]:
    """Extrae el body real de una respuesta del SDK de MP.

    El SDK retorna `{"status": <int>, "response": <dict>}`. Esta función
    aísla el dict interno y devuelve `{}` si no existe.
    """
    if not isinstance(mp_response, dict):
        return {}
    body = mp_response.get("response")
    return body if isinstance(body, dict) else {}
