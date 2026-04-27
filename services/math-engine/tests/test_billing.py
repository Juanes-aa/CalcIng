"""
tests/test_billing.py — Tests para routers/billing.py con Stripe mockeado.
"""
import uuid
import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch, MagicMock
from jose import jwt
from core.keys import get_private_key

ALGORITHM = "RS256"
ACCESS_TOKEN_TTL_MINUTES = 60


def _make_token(plan: str = "free") -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_TTL_MINUTES)
    payload = {
        "sub": str(uuid.uuid4()),
        "exp": expire,
        "type": "access",
        "plan": plan,
    }
    return jwt.encode(payload, get_private_key(), algorithm=ALGORITHM)


@pytest.fixture
def auth_headers() -> dict:
    token = _make_token()
    return {"Authorization": f"Bearer {token}"}


# ─── /billing/status ────────────────────────────────────────────────────────────

class TestBillingStatus:

    @pytest.mark.anyio
    async def test_status_requires_auth(self, test_app):
        """GET /billing/status sin JWT retorna 401"""
        response = await test_app.get("/billing/status")
        assert response.status_code == 401

    @pytest.mark.anyio
    async def test_status_returns_plan(self, test_app):
        """GET /billing/status con usuario registrado retorna plan 'free'"""
        # Registrar y logear
        await test_app.post("/auth/register", json={
            "email": "billing@example.com",
            "password": "SecurePass123!"
        })
        login = await test_app.post("/auth/login", json={
            "email": "billing@example.com",
            "password": "SecurePass123!"
        })
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        response = await test_app.get("/billing/status", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["plan"] == "free"
        assert data["expires_at"] is None


# ─── /billing/create-checkout ────────────────────────────────────────────────────

class TestCreateCheckout:

    @pytest.mark.anyio
    async def test_checkout_requires_auth(self, test_app):
        """POST /billing/create-checkout sin JWT retorna 401"""
        response = await test_app.post("/billing/create-checkout", json={
            "price_id": "price_test"
        })
        assert response.status_code == 401

    @pytest.mark.anyio
    async def test_checkout_creates_session(self, test_app):
        """POST /billing/create-checkout con Stripe mockeado retorna URL"""
        await test_app.post("/auth/register", json={
            "email": "checkout@example.com",
            "password": "SecurePass123!"
        })
        login = await test_app.post("/auth/login", json={
            "email": "checkout@example.com",
            "password": "SecurePass123!"
        })
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        mock_customer = MagicMock()
        mock_customer.id = "cus_test123"

        mock_session = MagicMock()
        mock_session.url = "https://checkout.stripe.com/test"

        # Inyectar el price_id en el mapa para simular un plan oficial cargado.
        from routers.billing import PRICE_TO_PLAN
        PRICE_TO_PLAN["price_pro_monthly"] = "pro"

        with patch("routers.billing.get_stripe") as mock_stripe:
            s = MagicMock()
            s.Customer.create.return_value = mock_customer
            s.checkout.Session.create.return_value = mock_session
            mock_stripe.return_value = s

            response = await test_app.post(
                "/billing/create-checkout",
                json={"price_id": "price_pro_monthly"},
                headers=headers,
            )

        assert response.status_code == 200
        assert response.json()["url"] == "https://checkout.stripe.com/test"

    @pytest.mark.anyio
    async def test_checkout_rejects_unknown_price_id(self, test_app):
        """POST /billing/create-checkout con price_id no whitelisted → 400"""
        await test_app.post("/auth/register", json={
            "email": "badprice@example.com",
            "password": "SecurePass123!"
        })
        login = await test_app.post("/auth/login", json={
            "email": "badprice@example.com",
            "password": "SecurePass123!"
        })
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        response = await test_app.post(
            "/billing/create-checkout",
            json={"price_id": "price_attacker_owned"},
            headers=headers,
        )
        assert response.status_code == 400
        assert "Invalid price_id" in response.json()["detail"]


# ─── /billing/portal ────────────────────────────────────────────────────────────

class TestCustomerPortal:

    @pytest.mark.anyio
    async def test_portal_requires_auth(self, test_app):
        """POST /billing/portal sin JWT retorna 401"""
        response = await test_app.post("/billing/portal")
        assert response.status_code == 401

    @pytest.mark.anyio
    async def test_portal_no_stripe_customer(self, test_app):
        """POST /billing/portal sin stripe_customer_id retorna 400"""
        await test_app.post("/auth/register", json={
            "email": "noportal@example.com",
            "password": "SecurePass123!"
        })
        login = await test_app.post("/auth/login", json={
            "email": "noportal@example.com",
            "password": "SecurePass123!"
        })
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        response = await test_app.post("/billing/portal", headers=headers)
        assert response.status_code == 400


# ─── /billing/webhook ───────────────────────────────────────────────────────────

class TestWebhook:

    @pytest.mark.anyio
    async def test_webhook_invalid_signature(self, test_app):
        """POST /billing/webhook con firma inválida retorna 400"""
        response = await test_app.post(
            "/billing/webhook",
            content=b'{}',
            headers={"stripe-signature": "bad_sig"},
        )
        assert response.status_code == 400
