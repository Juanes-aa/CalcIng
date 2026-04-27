"""
tests/test_billing.py — Tests para routers/billing.py con Mercado Pago mockeado.

Endpoints cubiertos:
- GET  /billing/status
- POST /billing/create-checkout
- POST /billing/cancel
- POST /billing/webhook
"""
from __future__ import annotations

import hashlib
import hmac
import json
from typing import Any
from unittest.mock import MagicMock, patch

import pytest


# ─── Helpers ────────────────────────────────────────────────────────────────────

def _mp_response(body: dict[str, Any], status: int = 201) -> dict[str, Any]:
    """Estructura típica que retorna el SDK de mercadopago."""
    return {"status": status, "response": body}


def _build_mock_sdk(
    create_body: dict[str, Any] | None = None,
    update_body: dict[str, Any] | None = None,
    get_body: dict[str, Any] | None = None,
) -> MagicMock:
    sdk = MagicMock()
    preapproval = MagicMock()
    preapproval.create.return_value = _mp_response(
        create_body or {}, status=201
    )
    preapproval.update.return_value = _mp_response(
        update_body or {"status": "cancelled"}, status=200
    )
    preapproval.get.return_value = _mp_response(get_body or {}, status=200)
    sdk.preapproval.return_value = preapproval
    return sdk


async def _register_and_login(
    test_app, email: str = "billing@example.com", password: str = "SecurePass123!"
) -> dict[str, str]:
    await test_app.post("/auth/register", json={"email": email, "password": password})
    login = await test_app.post(
        "/auth/login", json={"email": email, "password": password}
    )
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _mp_signature_for(secret: str, request_id: str, data_id: str, ts: str) -> str:
    manifest = f"id:{data_id};request-id:{request_id};ts:{ts};"
    digest = hmac.new(secret.encode(), manifest.encode(), hashlib.sha256).hexdigest()
    return f"ts={ts},v1={digest}"


# ─── /billing/status ────────────────────────────────────────────────────────────

class TestBillingStatus:

    @pytest.mark.anyio
    async def test_status_requires_auth(self, test_app):
        response = await test_app.get("/billing/status")
        assert response.status_code == 401

    @pytest.mark.anyio
    async def test_status_returns_plan(self, test_app):
        headers = await _register_and_login(test_app, "status@example.com")
        response = await test_app.get("/billing/status", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["plan"] == "free"
        assert data["expires_at"] is None


# ─── /billing/create-checkout ───────────────────────────────────────────────────

class TestCreateCheckout:

    @pytest.mark.anyio
    async def test_checkout_requires_auth(self, test_app):
        response = await test_app.post(
            "/billing/create-checkout", json={"plan_id": "any"}
        )
        assert response.status_code == 401

    @pytest.mark.anyio
    async def test_checkout_creates_preapproval(self, test_app):
        """POST /billing/create-checkout retorna init_point y subscription_id."""
        headers = await _register_and_login(test_app, "checkout@example.com")

        from routers.billing import PLAN_TO_TIER
        PLAN_TO_TIER["plan_pro_monthly_test"] = "pro"

        sdk = _build_mock_sdk(create_body={
            "id": "sub_abc123",
            "init_point": "https://www.mercadopago.com.co/subscriptions/checkout?xxx",
            "status": "pending",
        })

        with patch("routers.billing.get_mp_sdk", return_value=sdk):
            response = await test_app.post(
                "/billing/create-checkout",
                json={"plan_id": "plan_pro_monthly_test"},
                headers=headers,
            )

        assert response.status_code == 200
        data = response.json()
        assert data["url"] == "https://www.mercadopago.com.co/subscriptions/checkout?xxx"
        assert data["subscription_id"] == "sub_abc123"
        # Verifica que el SDK recibió un payload con los campos clave
        sdk.preapproval.return_value.create.assert_called_once()
        sent_payload = sdk.preapproval.return_value.create.call_args[0][0]
        assert sent_payload["preapproval_plan_id"] == "plan_pro_monthly_test"
        assert sent_payload["status"] == "pending"
        assert "external_reference" in sent_payload
        assert "back_url" in sent_payload

    @pytest.mark.anyio
    async def test_checkout_rejects_unknown_plan_id(self, test_app):
        headers = await _register_and_login(test_app, "badplan@example.com")
        response = await test_app.post(
            "/billing/create-checkout",
            json={"plan_id": "plan_attacker_owned"},
            headers=headers,
        )
        assert response.status_code == 400
        assert "Invalid plan_id" in response.json()["detail"]

    @pytest.mark.anyio
    async def test_checkout_handles_mp_failure(self, test_app):
        """Si MP devuelve respuesta sin init_point/id, retorna 400 sin leak."""
        headers = await _register_and_login(test_app, "mpfail@example.com")

        from routers.billing import PLAN_TO_TIER
        PLAN_TO_TIER["plan_pro_fail_test"] = "pro"

        sdk = _build_mock_sdk(create_body={"status": "rejected"})  # sin id ni init_point

        with patch("routers.billing.get_mp_sdk", return_value=sdk):
            response = await test_app.post(
                "/billing/create-checkout",
                json={"plan_id": "plan_pro_fail_test"},
                headers=headers,
            )
        assert response.status_code == 400


# ─── /billing/cancel ────────────────────────────────────────────────────────────

class TestCancelSubscription:

    @pytest.mark.anyio
    async def test_cancel_requires_auth(self, test_app):
        response = await test_app.post("/billing/cancel")
        assert response.status_code == 401

    @pytest.mark.anyio
    async def test_cancel_no_subscription(self, test_app):
        """POST /billing/cancel sin mp_subscription_id retorna 400."""
        headers = await _register_and_login(test_app, "nocancel@example.com")
        response = await test_app.post("/billing/cancel", headers=headers)
        assert response.status_code == 400

    @pytest.mark.anyio
    async def test_cancel_success(self, test_app):
        """Después de checkout exitoso, /billing/cancel marca free localmente."""
        headers = await _register_and_login(test_app, "cancelok@example.com")

        from routers.billing import PLAN_TO_TIER
        PLAN_TO_TIER["plan_pro_cancel_test"] = "pro"

        sdk = _build_mock_sdk(
            create_body={
                "id": "sub_to_cancel",
                "init_point": "https://www.mercadopago.com.co/subscriptions/checkout?abc",
                "status": "pending",
            },
            update_body={"id": "sub_to_cancel", "status": "cancelled"},
        )

        with patch("routers.billing.get_mp_sdk", return_value=sdk):
            checkout = await test_app.post(
                "/billing/create-checkout",
                json={"plan_id": "plan_pro_cancel_test"},
                headers=headers,
            )
            assert checkout.status_code == 200

            response = await test_app.post("/billing/cancel", headers=headers)

        assert response.status_code == 200
        assert response.json()["status"] == "cancelled"

        # Status debe reflejar plan=free
        status_resp = await test_app.get("/billing/status", headers=headers)
        assert status_resp.json()["plan"] == "free"
        assert status_resp.json()["expires_at"] is None
        sdk.preapproval.return_value.update.assert_called_once_with(
            "sub_to_cancel", {"status": "cancelled"}
        )


# ─── /billing/webhook ───────────────────────────────────────────────────────────

class TestWebhook:

    @pytest.mark.anyio
    async def test_webhook_invalid_signature(self, test_app):
        """Sin firma válida → 400."""
        body = {"type": "subscription_preapproval", "data": {"id": "sub_x"}}
        response = await test_app.post(
            "/billing/webhook",
            content=json.dumps(body).encode(),
            headers={
                "Content-Type": "application/json",
                "x-signature": "ts=1,v1=deadbeef",
                "x-request-id": "req-1",
            },
        )
        assert response.status_code == 400

    @pytest.mark.anyio
    async def test_webhook_missing_data_id(self, test_app):
        body = {"type": "subscription_preapproval", "data": {}}
        response = await test_app.post(
            "/billing/webhook",
            content=json.dumps(body).encode(),
            headers={
                "Content-Type": "application/json",
                "x-signature": "ts=1,v1=deadbeef",
                "x-request-id": "req-1",
            },
        )
        assert response.status_code == 400

    @pytest.mark.anyio
    async def test_webhook_subscription_authorized_updates_plan(self, test_app):
        """preapproval con status=authorized actualiza user.plan al tier mapeado."""
        headers = await _register_and_login(test_app, "wh_auth@example.com")

        from routers.billing import PLAN_TO_TIER
        PLAN_TO_TIER["plan_pro_wh_auth"] = "pro"

        # Primer checkout para que el user tenga mp_subscription_id
        sdk_create = _build_mock_sdk(create_body={
            "id": "sub_wh_auth",
            "init_point": "https://www.mercadopago.com.co/x",
            "status": "pending",
        })
        with patch("routers.billing.get_mp_sdk", return_value=sdk_create):
            await test_app.post(
                "/billing/create-checkout",
                json={"plan_id": "plan_pro_wh_auth"},
                headers=headers,
            )

        # Recuperamos external_reference (user.id) desde el payload enviado
        sent_payload = sdk_create.preapproval.return_value.create.call_args[0][0]
        external_ref = sent_payload["external_reference"]

        # Webhook event: authorized
        secret = "whsec_test"
        request_id = "req-auth-1"
        data_id = "sub_wh_auth"
        ts = "1700000000"
        sig = _mp_signature_for(secret, request_id, data_id, ts)

        sdk_get = _build_mock_sdk(get_body={
            "id": "sub_wh_auth",
            "status": "authorized",
            "preapproval_plan_id": "plan_pro_wh_auth",
            "external_reference": external_ref,
            "payer_email": "wh_auth@example.com",
            "next_payment_date": "2026-05-27T00:00:00.000-04:00",
        })

        body = {
            "type": "subscription_preapproval",
            "data": {"id": data_id},
        }
        with patch("core.mercadopago_client.settings") as mock_settings, \
             patch("routers.billing.get_mp_sdk", return_value=sdk_get):
            mock_settings.MP_WEBHOOK_SECRET = secret
            response = await test_app.post(
                "/billing/webhook",
                content=json.dumps(body).encode(),
                headers={
                    "Content-Type": "application/json",
                    "x-signature": sig,
                    "x-request-id": request_id,
                },
            )

        assert response.status_code == 200
        status_resp = await test_app.get("/billing/status", headers=headers)
        assert status_resp.json()["plan"] == "pro"
        assert status_resp.json()["expires_at"] is not None

    @pytest.mark.anyio
    async def test_webhook_subscription_cancelled_reverts_to_free(self, test_app):
        """preapproval con status=cancelled marca plan=free."""
        headers = await _register_and_login(test_app, "wh_cancel@example.com")

        from routers.billing import PLAN_TO_TIER
        PLAN_TO_TIER["plan_pro_wh_cancel"] = "pro"

        sdk_create = _build_mock_sdk(create_body={
            "id": "sub_wh_cancel",
            "init_point": "https://www.mercadopago.com.co/x",
            "status": "pending",
        })
        with patch("routers.billing.get_mp_sdk", return_value=sdk_create):
            await test_app.post(
                "/billing/create-checkout",
                json={"plan_id": "plan_pro_wh_cancel"},
                headers=headers,
            )

        sent_payload = sdk_create.preapproval.return_value.create.call_args[0][0]
        external_ref = sent_payload["external_reference"]

        # Primero llevamos al user a authorized
        secret = "whsec_test"
        ts = "1700000000"
        data_id = "sub_wh_cancel"

        for sub_status, expected_plan in (
            ("authorized", "pro"),
            ("cancelled", "free"),
        ):
            request_id = f"req-{sub_status}"
            sig = _mp_signature_for(secret, request_id, data_id, ts)
            sdk_get = _build_mock_sdk(get_body={
                "id": data_id,
                "status": sub_status,
                "preapproval_plan_id": "plan_pro_wh_cancel",
                "external_reference": external_ref,
                "payer_email": "wh_cancel@example.com",
                "next_payment_date": "2026-05-27T00:00:00.000-04:00",
            })
            body = {
                "type": "subscription_preapproval",
                "data": {"id": data_id},
            }
            with patch("core.mercadopago_client.settings") as mock_settings, \
                 patch("routers.billing.get_mp_sdk", return_value=sdk_get):
                mock_settings.MP_WEBHOOK_SECRET = secret
                response = await test_app.post(
                    "/billing/webhook",
                    content=json.dumps(body).encode(),
                    headers={
                        "Content-Type": "application/json",
                        "x-signature": sig,
                        "x-request-id": request_id,
                    },
                )
            assert response.status_code == 200
            status_resp = await test_app.get("/billing/status", headers=headers)
            assert status_resp.json()["plan"] == expected_plan

    @pytest.mark.anyio
    async def test_webhook_idempotent(self, test_app):
        """El mismo evento authorized aplicado 2 veces no rompe nada."""
        headers = await _register_and_login(test_app, "wh_idem@example.com")

        from routers.billing import PLAN_TO_TIER
        PLAN_TO_TIER["plan_pro_wh_idem"] = "pro"

        sdk_create = _build_mock_sdk(create_body={
            "id": "sub_wh_idem",
            "init_point": "https://www.mercadopago.com.co/x",
            "status": "pending",
        })
        with patch("routers.billing.get_mp_sdk", return_value=sdk_create):
            await test_app.post(
                "/billing/create-checkout",
                json={"plan_id": "plan_pro_wh_idem"},
                headers=headers,
            )

        sent_payload = sdk_create.preapproval.return_value.create.call_args[0][0]
        external_ref = sent_payload["external_reference"]

        secret = "whsec_test"
        ts = "1700000000"
        data_id = "sub_wh_idem"
        sdk_get = _build_mock_sdk(get_body={
            "id": data_id,
            "status": "authorized",
            "preapproval_plan_id": "plan_pro_wh_idem",
            "external_reference": external_ref,
            "payer_email": "wh_idem@example.com",
            "next_payment_date": "2026-05-27T00:00:00.000-04:00",
        })

        body = {"type": "subscription_preapproval", "data": {"id": data_id}}
        for n in range(2):
            request_id = f"req-idem-{n}"
            sig = _mp_signature_for(secret, request_id, data_id, ts)
            with patch("core.mercadopago_client.settings") as mock_settings, \
                 patch("routers.billing.get_mp_sdk", return_value=sdk_get):
                mock_settings.MP_WEBHOOK_SECRET = secret
                response = await test_app.post(
                    "/billing/webhook",
                    content=json.dumps(body).encode(),
                    headers={
                        "Content-Type": "application/json",
                        "x-signature": sig,
                        "x-request-id": request_id,
                    },
                )
            assert response.status_code == 200

        status_resp = await test_app.get("/billing/status", headers=headers)
        assert status_resp.json()["plan"] == "pro"
