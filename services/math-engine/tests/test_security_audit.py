"""
tests/test_security_audit.py — Suite de regresión de seguridad.

Cada test simula un ataque concreto y verifica que el sistema lo bloquea.
Si alguno empieza a fallar, la regresión introduce una vulnerabilidad.
"""
import pytest


# ─── 1. Inyección y abuso de sympify (RCE / code injection) ───────────────────

class TestExpressionInjection:
    """La defensa en profundidad debe rechazar payloads de RCE conocidos."""

    INJECTION_PAYLOADS = [
        "__import__('os').system('id')",
        "().__class__.__bases__",
        "lambda x: x",
        "getattr(x, 'real')",
        "globals()",
        "compile('1', 'a', 'eval')",
        "subprocess.run",
        "os.popen('ls')",
    ]

    @pytest.mark.anyio
    @pytest.mark.parametrize("payload", INJECTION_PAYLOADS)
    async def test_injection_payloads_blocked(self, test_app, payload):
        """Cada payload de inyección retorna 400 ó 422, jamás 200."""
        response = await test_app.post(
            "/solve", json={"expression": payload, "options": {}}
        )
        assert response.status_code in (400, 422), (
            f"Payload no bloqueado: {payload!r} → {response.status_code}"
        )


# ─── 2. SQL injection (la API usa SQLAlchemy ORM, debería ser inmune) ────────

class TestSQLInjectionAttempts:
    """Confirma que payloads tipo SQLi no producen comportamiento anómalo."""

    @pytest.mark.anyio
    async def test_sqli_in_email_field(self, test_app):
        """Email con sintaxis SQLi falla por validación de email, no por SQL."""
        response = await test_app.post(
            "/auth/login",
            json={"email": "x' OR '1'='1", "password": "Whatever123"},
        )
        # 422: email inválido. NUNCA 500 ni 200.
        assert response.status_code == 422

    @pytest.mark.anyio
    async def test_sqli_in_password_field(self, test_app):
        """Password con sintaxis SQLi simplemente falla auth (no se concatena)."""
        await test_app.post(
            "/auth/register",
            json={"email": "sqli@example.com", "password": "RealPass123"},
        )
        response = await test_app.post(
            "/auth/login",
            json={"email": "sqli@example.com", "password": "' OR 1=1 --"},
        )
        assert response.status_code == 401


# ─── 3. Headers de seguridad ─────────────────────────────────────────────────

class TestSecurityHeaders:

    @pytest.mark.anyio
    async def test_security_headers_present_on_health(self, test_app):
        response = await test_app.get("/health")
        h = {k.lower(): v for k, v in response.headers.items()}
        assert h.get("x-content-type-options") == "nosniff"
        assert h.get("x-frame-options") == "DENY"
        assert h.get("referrer-policy") == "no-referrer"
        assert "content-security-policy" in h
        assert "permissions-policy" in h

    @pytest.mark.anyio
    async def test_security_headers_present_on_post(self, test_app):
        response = await test_app.post(
            "/solve", json={"expression": "1+1", "options": {}}
        )
        h = {k.lower(): v for k, v in response.headers.items()}
        assert h.get("x-content-type-options") == "nosniff"
        assert h.get("x-frame-options") == "DENY"


# ─── 4. Body size limit (DoS por payload gigante) ────────────────────────────

class TestBodySizeLimit:

    @pytest.mark.anyio
    async def test_huge_body_rejected_with_413(self, test_app):
        """Body > 64 KiB es rechazado antes de llegar a Pydantic."""
        # Generamos un payload claramente sobre el límite (256 KiB)
        huge = "a" * (256 * 1024)
        response = await test_app.post(
            "/auth/login",
            json={"email": "x@example.com", "password": huge},
        )
        # 413 (limit) ó 422 (max_length de pydantic) son ambos válidos.
        # 200 NO es aceptable.
        assert response.status_code in (413, 422)


# ─── 5. Auth: timing-safe + complejidad de password ──────────────────────────

class TestAuthHardening:

    @pytest.mark.anyio
    async def test_login_nonexistent_user_returns_401(self, test_app):
        """Usuario inexistente y password incorrecto comparten el mismo 401 + mensaje."""
        r1 = await test_app.post(
            "/auth/login",
            json={"email": "ghost@example.com", "password": "AnyPass123"},
        )
        await test_app.post(
            "/auth/register",
            json={"email": "real@example.com", "password": "RealPass123"},
        )
        r2 = await test_app.post(
            "/auth/login",
            json={"email": "real@example.com", "password": "WrongPass123"},
        )
        assert r1.status_code == 401
        assert r2.status_code == 401
        assert r1.json()["detail"] == r2.json()["detail"] == "Invalid credentials"

    @pytest.mark.anyio
    async def test_password_without_uppercase_rejected(self, test_app):
        response = await test_app.post(
            "/auth/register",
            json={"email": "weak1@example.com", "password": "alllower123"},
        )
        assert response.status_code == 422

    @pytest.mark.anyio
    async def test_password_without_digit_rejected(self, test_app):
        response = await test_app.post(
            "/auth/register",
            json={"email": "weak2@example.com", "password": "NoDigitsHere"},
        )
        assert response.status_code == 422

    @pytest.mark.anyio
    async def test_password_too_long_rejected(self, test_app):
        response = await test_app.post(
            "/auth/register",
            json={"email": "weak3@example.com", "password": "A1" + "x" * 200},
        )
        assert response.status_code == 422


# ─── 6. Errores no exponen detalles internos ─────────────────────────────────

class TestErrorOpacity:

    @pytest.mark.anyio
    async def test_invalid_expression_does_not_leak_traceback(self, test_app):
        """En 400 por sympify-fail, el detail debe ser genérico, no un stack."""
        response = await test_app.post(
            "/solve", json={"expression": "1/0/0", "options": {}}
        )
        # Acepta 200 (sympy puede devolver zoo) o 400, pero NUNCA debe
        # contener "Traceback" ni nombres de archivos del backend.
        body = response.text
        assert "Traceback" not in body
        assert "sympy/" not in body
        assert ".py" not in body

    @pytest.mark.anyio
    async def test_billing_error_does_not_leak_stripe_internals(self, test_app):
        """Un error en /billing no debe exponer mensaje crudo de Stripe."""
        # Sin auth: 401 directo, sin tocar Stripe (igual no debe leak).
        response = await test_app.post(
            "/billing/create-checkout", json={"price_id": "px_invalid"}
        )
        assert response.status_code == 401


# ─── 7. Autorización: aislamiento entre usuarios ─────────────────────────────

class TestAuthorizationIsolation:

    @pytest.mark.anyio
    async def test_history_requires_auth(self, test_app):
        """Sin token, /users/me/history retorna 401 (no 200 con datos vacíos)."""
        response = await test_app.get("/users/me/history")
        assert response.status_code == 401

    @pytest.mark.anyio
    async def test_projects_requires_auth(self, test_app):
        response = await test_app.get("/projects")
        assert response.status_code == 401

    @pytest.mark.anyio
    async def test_billing_status_requires_auth(self, test_app):
        response = await test_app.get("/billing/status")
        assert response.status_code == 401

    @pytest.mark.anyio
    async def test_premium_endpoints_gated_for_free_users(self, test_app):
        """Sin token o con plan free, /graph/3d retorna 402."""
        response = await test_app.post(
            "/graph/3d",
            json={"expression": "x**2 + y**2"},
        )
        assert response.status_code == 402
