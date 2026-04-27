"""
routers/billing.py — Endpoints de facturación con Stripe.
"""
import logging
import uuid
from urllib.parse import urlparse

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.auth_deps import require_auth
from core.config import settings
from core.limiter import limiter
from core.stripe_client import get_stripe
from db.database import get_db
from db.models import User

log = logging.getLogger("calcing.billing")

router = APIRouter(prefix="/billing", tags=["billing"])


# ─── Validación de URLs externas (anti open-redirect) ─────────────────────────

def _is_allowed_redirect(url: str) -> bool:
    """Valida que la URL apunte a uno de nuestros orígenes permitidos.
    Evita que un atacante use Stripe checkout para redirigir a sitios maliciosos."""
    if not url:
        return False
    try:
        parsed = urlparse(url)
    except Exception:
        return False
    if parsed.scheme not in ("http", "https"):
        return False
    origin = f"{parsed.scheme}://{parsed.netloc}"
    return origin in settings.ALLOWED_ORIGINS

# ─── Mapeo price_id → plan ─────────────────────────────────────────────────────

PRICE_TO_PLAN: dict[str, str] = {}


def _build_price_map() -> None:
    """Construye el mapeo price_id → plan una vez que settings esté cargado."""
    if PRICE_TO_PLAN:
        return
    mapping = {
        settings.STRIPE_PRICE_PRO_MONTHLY: "pro",
        settings.STRIPE_PRICE_PRO_ANNUAL: "pro",
        settings.STRIPE_PRICE_ENTERPRISE_MONTHLY: "enterprise",
        settings.STRIPE_PRICE_ENTERPRISE_ANNUAL: "enterprise",
    }
    for price_id, plan in mapping.items():
        if price_id:
            PRICE_TO_PLAN[price_id] = plan


# ─── Schemas ────────────────────────────────────────────────────────────────────

class CheckoutRequest(BaseModel):
    price_id: str = Field(..., min_length=1, max_length=200)
    success_url: str = Field(default="", max_length=2048)
    cancel_url: str = Field(default="", max_length=2048)


class CheckoutResponse(BaseModel):
    url: str


class PortalResponse(BaseModel):
    url: str


class BillingStatusResponse(BaseModel):
    plan: str
    expires_at: str | None


# ─── Helpers ────────────────────────────────────────────────────────────────────

async def _get_or_create_customer(
    user: User,
    db: AsyncSession,
    s: stripe,
) -> str:
    """Retorna stripe_customer_id, creando el customer si no existe."""
    if user.stripe_customer_id:
        return user.stripe_customer_id
    customer = s.Customer.create(
        email=user.email,
        metadata={"calcing_user_id": str(user.id)},
    )
    user.stripe_customer_id = customer.id
    await db.commit()
    return customer.id


# ─── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/create-checkout", response_model=CheckoutResponse)
@limiter.limit("10/minute;30/hour")
async def create_checkout(
    request: Request,
    body: CheckoutRequest,
    user_id: str = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
) -> CheckoutResponse:
    _build_price_map()
    s = get_stripe()

    # Sólo aceptamos price_ids que estén en nuestro mapa de planes oficiales.
    # Esto previene que un atacante use price_ids de productos ajenos en Stripe.
    if body.price_id not in PRICE_TO_PLAN:
        raise HTTPException(status_code=400, detail="Invalid price_id")

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    customer_id = await _get_or_create_customer(user, db, s)

    # Defensa anti open-redirect: si el cliente envía una URL no-whitelisted, la ignoramos.
    default_success = f"{settings.ALLOWED_ORIGINS[0]}/checkout/success"
    default_cancel = f"{settings.ALLOWED_ORIGINS[0]}/precios"
    success = body.success_url if _is_allowed_redirect(body.success_url) else default_success
    cancel = body.cancel_url if _is_allowed_redirect(body.cancel_url) else default_cancel

    try:
        session = s.checkout.Session.create(
            customer=customer_id,
            mode="subscription",
            line_items=[{"price": body.price_id, "quantity": 1}],
            success_url=f"{success}?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=cancel,
            metadata={"calcing_user_id": str(user.id)},
        )
    except stripe.error.StripeError as e:
        log.warning("stripe checkout failed user=%s: %s", user_id, e, exc_info=False)
        raise HTTPException(status_code=400, detail="No se pudo crear la sesión de checkout")

    return CheckoutResponse(url=session.url)


@router.post("/portal", response_model=PortalResponse)
@limiter.limit("10/minute;30/hour")
async def customer_portal(
    request: Request,
    user_id: str = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
) -> PortalResponse:
    s = get_stripe()

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No billing account found")

    return_url = f"{settings.ALLOWED_ORIGINS[0]}/precios"

    try:
        session = s.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url=return_url,
        )
    except stripe.error.StripeError as e:
        log.warning("stripe portal failed user=%s: %s", user_id, e, exc_info=False)
        raise HTTPException(status_code=400, detail="No se pudo abrir el portal de facturación")

    return PortalResponse(url=session.url)


@router.get("/status", response_model=BillingStatusResponse)
async def billing_status(
    user_id: str = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
) -> BillingStatusResponse:
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return BillingStatusResponse(
        plan=user.plan,
        expires_at=user.plan_expires_at.isoformat() if user.plan_expires_at else None,
    )


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """Recibe eventos de Stripe. No requiere JWT — valida con webhook secret."""
    _build_price_map()
    s = get_stripe()

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = s.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_type: str = event["type"]

    if event_type == "checkout.session.completed":
        await _handle_checkout_completed(event["data"]["object"], db)
    elif event_type in (
        "customer.subscription.updated",
        "customer.subscription.deleted",
    ):
        await _handle_subscription_change(event["data"]["object"], db)

    return JSONResponse(content={"status": "ok"})


# ─── Webhook handlers ──────────────────────────────────────────────────────────

async def _handle_checkout_completed(
    session_obj: dict, db: AsyncSession
) -> None:
    """Actualiza plan del usuario tras checkout exitoso."""
    customer_id: str = session_obj.get("customer", "")
    subscription_id: str = session_obj.get("subscription", "")

    if not customer_id or not subscription_id:
        return

    s = get_stripe()
    subscription = s.Subscription.retrieve(subscription_id)
    price_id = subscription["items"]["data"][0]["price"]["id"]
    new_plan = PRICE_TO_PLAN.get(price_id, "free")
    period_end = subscription.get("current_period_end")

    result = await db.execute(
        select(User).where(User.stripe_customer_id == customer_id)
    )
    user = result.scalars().first()
    if user:
        user.plan = new_plan
        if period_end:
            from datetime import datetime, timezone
            user.plan_expires_at = datetime.fromtimestamp(
                period_end, tz=timezone.utc
            )
        await db.commit()


async def _handle_subscription_change(
    subscription_obj: dict, db: AsyncSession
) -> None:
    """Actualiza plan cuando la suscripción cambia o se cancela."""
    customer_id: str = subscription_obj.get("customer", "")
    sub_status: str = subscription_obj.get("status", "")

    if not customer_id:
        return

    if sub_status in ("canceled", "unpaid", "incomplete_expired"):
        new_plan = "free"
        period_end = None
    else:
        price_id = subscription_obj["items"]["data"][0]["price"]["id"]
        new_plan = PRICE_TO_PLAN.get(price_id, "free")
        period_end = subscription_obj.get("current_period_end")

    result = await db.execute(
        select(User).where(User.stripe_customer_id == customer_id)
    )
    user = result.scalars().first()
    if user:
        user.plan = new_plan
        if period_end:
            from datetime import datetime, timezone
            user.plan_expires_at = datetime.fromtimestamp(
                period_end, tz=timezone.utc
            )
        else:
            user.plan_expires_at = None
        await db.commit()
