"""
routers/billing.py — Endpoints de facturación con Mercado Pago (preapproval).

Endpoints:
- POST /billing/create-checkout → crea preapproval, retorna init_point.
- GET  /billing/status          → retorna plan + expires_at del usuario.
- POST /billing/cancel          → cancela mp_subscription_id del usuario.
- POST /billing/webhook         → recibe notificaciones de MP (HMAC firmado).
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth_deps import require_auth
from core.config import settings
from core.limiter import limiter
from core.mercadopago_client import (
    build_plan_to_tier_map,
    extract_response_body,
    get_mp_sdk,
    verify_mp_signature,
)
from db.database import get_db
from db.models import User

log = logging.getLogger("calcing.billing")

router = APIRouter(prefix="/billing", tags=["billing"])


# ─── Mapeo plan_id → tier ──────────────────────────────────────────────────────
# Se construye lazy en cada request (build es barato). Tests pueden inyectar
# entradas sintéticas modificando PLAN_TO_TIER directamente.

PLAN_TO_TIER: dict[str, str] = {}


def _refresh_plan_map() -> None:
    """Re-merge desde settings sin destruir entradas inyectadas por tests."""
    for plan_id, tier in build_plan_to_tier_map().items():
        PLAN_TO_TIER.setdefault(plan_id, tier)


# ─── Schemas ────────────────────────────────────────────────────────────────────

class CheckoutRequest(BaseModel):
    plan_id: str = Field(..., min_length=1, max_length=200)


class CheckoutResponse(BaseModel):
    url: str
    subscription_id: str


class CancelResponse(BaseModel):
    status: str


class BillingStatusResponse(BaseModel):
    plan: str
    expires_at: str | None


# ─── Helpers ────────────────────────────────────────────────────────────────────

async def _get_user(user_id: str, db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalars().first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def _parse_iso_datetime(value: str | None) -> datetime | None:
    """Parsea un timestamp ISO 8601 de MP (puede traer 'Z' o offset)."""
    if not value or not isinstance(value, str):
        return None
    try:
        normalized = value.replace("Z", "+00:00")
        dt = datetime.fromisoformat(normalized)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except (ValueError, TypeError):
        return None


# ─── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/create-checkout", response_model=CheckoutResponse)
@limiter.limit("10/minute;30/hour")
async def create_checkout(
    request: Request,
    body: CheckoutRequest,
    user_id: str = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
) -> CheckoutResponse:
    """Crea un preapproval en MP en estado 'pending' y retorna el init_point."""
    _refresh_plan_map()

    if body.plan_id not in PLAN_TO_TIER:
        raise HTTPException(status_code=400, detail="Invalid plan_id")

    user = await _get_user(user_id, db)

    sdk = get_mp_sdk()
    back_url = f"{settings.ALLOWED_ORIGINS[0]}/checkout/success"

    payload: dict[str, Any] = {
        "preapproval_plan_id": body.plan_id,
        "payer_email": user.email,
        "back_url": back_url,
        "external_reference": str(user.id),
        "status": "pending",
    }

    try:
        mp_response = sdk.preapproval().create(payload)
    except Exception as e:  # SDK puede tirar excepciones genéricas
        log.warning("mp preapproval create failed user=%s: %s", user_id, e)
        raise HTTPException(status_code=400, detail="No se pudo crear la suscripción")

    response_body = extract_response_body(mp_response)
    init_point = response_body.get("init_point")
    subscription_id = response_body.get("id")

    if not init_point or not subscription_id:
        log.warning("mp preapproval missing fields user=%s body=%s", user_id, response_body)
        raise HTTPException(status_code=400, detail="Respuesta inválida de Mercado Pago")

    # Persistimos el subscription_id y email para que el webhook pueda correlacionar
    # incluso si external_reference llegara a faltar.
    user.mp_subscription_id = str(subscription_id)
    user.mp_customer_email = user.email
    await db.commit()

    return CheckoutResponse(url=str(init_point), subscription_id=str(subscription_id))


@router.get("/status", response_model=BillingStatusResponse)
async def billing_status(
    user_id: str = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
) -> BillingStatusResponse:
    user = await _get_user(user_id, db)
    return BillingStatusResponse(
        plan=user.plan,
        expires_at=user.plan_expires_at.isoformat() if user.plan_expires_at else None,
    )


@router.post("/cancel", response_model=CancelResponse)
@limiter.limit("10/minute;30/hour")
async def cancel_subscription(
    request: Request,
    user_id: str = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
) -> CancelResponse:
    """Cancela la suscripción activa del usuario en MP (status='cancelled')."""
    user = await _get_user(user_id, db)

    if not user.mp_subscription_id:
        raise HTTPException(status_code=400, detail="No active subscription")

    sdk = get_mp_sdk()
    try:
        sdk.preapproval().update(user.mp_subscription_id, {"status": "cancelled"})
    except Exception as e:
        log.warning("mp cancel failed user=%s: %s", user_id, e)
        raise HTTPException(status_code=400, detail="No se pudo cancelar la suscripción")

    # Optimista: marcamos free localmente. El webhook confirmará y refrescará.
    user.plan = "free"
    user.plan_expires_at = None
    await db.commit()

    return CancelResponse(status="cancelled")


@router.post("/webhook")
async def mercadopago_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """Recibe notificaciones de MP. Valida HMAC con MP_WEBHOOK_SECRET."""
    _refresh_plan_map()

    signature_header = request.headers.get("x-signature", "")
    request_id = request.headers.get("x-request-id", "")

    try:
        body_json: dict[str, Any] = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    data = body_json.get("data") or {}
    data_id = str(data.get("id") or "")
    event_type = str(body_json.get("type") or "")

    if not data_id:
        raise HTTPException(status_code=400, detail="Missing data.id")

    if not verify_mp_signature(signature_header, request_id, data_id):
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event_type == "subscription_preapproval":
        await _handle_preapproval_event(data_id, db)
    elif event_type == "subscription_authorized_payment":
        await _handle_authorized_payment_event(data_id, db)
    # Otros tipos: ignorar silenciosamente (200 OK).

    return JSONResponse(content={"status": "ok"})


# ─── Webhook handlers ──────────────────────────────────────────────────────────

async def _find_user_for_subscription(
    external_reference: str | None,
    subscription_id: str,
    payer_email: str | None,
    db: AsyncSession,
) -> User | None:
    """Resuelve el User asociado a una suscripción.

    Estrategia (en orden):
    1. external_reference como UUID → User.id
    2. mp_subscription_id == subscription_id
    3. mp_customer_email == payer_email
    """
    if external_reference:
        try:
            user_uuid = uuid.UUID(external_reference)
        except (ValueError, AttributeError):
            user_uuid = None
        if user_uuid is not None:
            result = await db.execute(select(User).where(User.id == user_uuid))
            user = result.scalars().first()
            if user is not None:
                return user

    result = await db.execute(
        select(User).where(User.mp_subscription_id == subscription_id)
    )
    user = result.scalars().first()
    if user is not None:
        return user

    if payer_email:
        result = await db.execute(
            select(User).where(User.mp_customer_email == payer_email)
        )
        user = result.scalars().first()
        if user is not None:
            return user

    return None


async def _handle_preapproval_event(subscription_id: str, db: AsyncSession) -> None:
    """Procesa un evento de subscription_preapproval (autorizado/cancelado/pausado)."""
    sdk = get_mp_sdk()
    try:
        mp_response = sdk.preapproval().get(subscription_id)
    except Exception as e:
        log.warning("mp preapproval fetch failed id=%s: %s", subscription_id, e)
        return

    sub = extract_response_body(mp_response)
    if not sub:
        return

    sub_status = str(sub.get("status") or "")
    plan_id = str(sub.get("preapproval_plan_id") or "")
    external_reference = sub.get("external_reference")
    payer_email = sub.get("payer_email")
    next_payment = _parse_iso_datetime(sub.get("next_payment_date"))

    user = await _find_user_for_subscription(
        external_reference if isinstance(external_reference, str) else None,
        subscription_id,
        payer_email if isinstance(payer_email, str) else None,
        db,
    )
    if user is None:
        log.info("mp webhook: user not found subscription=%s", subscription_id)
        return

    # Idempotencia: si el estado ya refleja el evento, no re-escribir.
    if sub_status == "authorized":
        new_plan = PLAN_TO_TIER.get(plan_id, user.plan)
        already_synced = (
            user.plan == new_plan
            and user.mp_subscription_id == subscription_id
            and user.plan_expires_at == next_payment
        )
        if already_synced:
            return
        user.plan = new_plan
        user.mp_subscription_id = subscription_id
        if next_payment is not None:
            user.plan_expires_at = next_payment
    elif sub_status in ("cancelled", "paused"):
        if user.plan == "free" and user.plan_expires_at is None:
            return
        user.plan = "free"
        user.plan_expires_at = None
    else:
        # 'pending' u otros: nada que persistir aún.
        return

    await db.commit()


async def _handle_authorized_payment_event(payment_id: str, db: AsyncSession) -> None:
    """Procesa un pago recurrente exitoso. Refresca plan_expires_at."""
    sdk = get_mp_sdk()
    try:
        mp_response = sdk.preapproval().get(payment_id)
    except Exception:
        # Algunos SDKs exponen authorized_payment como recurso aparte. Si falla,
        # no rompemos el webhook — MP reintentará y la fuente de verdad está
        # en subscription_preapproval.
        return

    sub = extract_response_body(mp_response)
    if not sub:
        return

    next_payment = _parse_iso_datetime(sub.get("next_payment_date"))
    if next_payment is None:
        return

    external_reference = sub.get("external_reference")
    payer_email = sub.get("payer_email")
    user = await _find_user_for_subscription(
        external_reference if isinstance(external_reference, str) else None,
        str(sub.get("id") or payment_id),
        payer_email if isinstance(payer_email, str) else None,
        db,
    )
    if user is None or user.plan_expires_at == next_payment:
        return

    user.plan_expires_at = next_payment
    await db.commit()
