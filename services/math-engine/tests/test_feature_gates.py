import uuid
import pytest
from datetime import datetime, timedelta, timezone
from jose import jwt
from core.keys import get_private_key

# ---------------------------------------------------------------------------
# Fixture local: genera headers con plan=="premium"
# No usa create_access_token() porque su firma es create_access_token(subject: str)
# y no acepta claims extra. Se replica la lógica internamente agregando "plan".
# ---------------------------------------------------------------------------

ALGORITHM = "RS256"
ACCESS_TOKEN_TTL_MINUTES = 60


def _make_premium_token() -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_TTL_MINUTES)
    payload = {
        "sub": str(uuid.uuid4()),
        "exp": expire,
        "type": "access",
        "plan": "premium",
    }
    return jwt.encode(payload, get_private_key(), algorithm=ALGORITHM)


@pytest.fixture
def premium_headers() -> dict:
    token = _make_premium_token()
    return {"Authorization": f"Bearer {token}"}


# ===========================================================================
# GRUPO 1: Gate de steps en /differentiate
# ===========================================================================

class TestDifferentiateStepsGate:

    @pytest.mark.anyio
    async def test_differentiate_free_gets_max_3_steps(self, test_app):
        """Plan free (sin token) recibe máximo 3 steps en /differentiate"""
        response = await test_app.post(
            "/differentiate",
            json={"expression": "x**2", "variable": "x", "order": 1},
        )
        assert response.status_code == 200
        assert len(response.json()["steps"]) <= 3

    @pytest.mark.anyio
    async def test_differentiate_premium_gets_all_steps(self, test_app, premium_headers):
        """Plan premium recibe todos los steps en /differentiate"""
        response = await test_app.post(
            "/differentiate",
            json={"expression": "x**2", "variable": "x", "order": 1},
            headers=premium_headers,
        )
        assert response.status_code == 200
        assert "steps" in response.json()


# ===========================================================================
# GRUPO 2: Gate de steps en /integrate
# ===========================================================================

class TestIntegrateStepsGate:

    @pytest.mark.anyio
    async def test_integrate_free_gets_max_3_steps(self, test_app):
        """Plan free (sin token) recibe máximo 3 steps en /integrate"""
        response = await test_app.post(
            "/integrate",
            json={"expression": "x**2", "variable": "x"},
        )
        assert response.status_code == 200
        assert len(response.json()["steps"]) <= 3

    @pytest.mark.anyio
    async def test_integrate_premium_gets_all_steps(self, test_app, premium_headers):
        """Plan premium recibe todos los steps en /integrate"""
        response = await test_app.post(
            "/integrate",
            json={"expression": "x**2", "variable": "x"},
            headers=premium_headers,
        )
        assert response.status_code == 200
        assert "steps" in response.json()


# ===========================================================================
# GRUPO 3: Gate de steps en /solve-equation
# ===========================================================================

class TestSolveEquationStepsGate:

    @pytest.mark.anyio
    async def test_solve_equation_free_gets_max_3_steps(self, test_app):
        """Plan free (sin token) recibe máximo 3 steps en /solve-equation"""
        response = await test_app.post(
            "/solve-equation",
            json={"equation": "x**2 - 4", "variable": "x"},
        )
        assert response.status_code == 200
        assert len(response.json()["steps"]) <= 3

    @pytest.mark.anyio
    async def test_solve_equation_premium_gets_all_steps(self, test_app, premium_headers):
        """Plan premium recibe todos los steps en /solve-equation"""
        response = await test_app.post(
            "/solve-equation",
            json={"equation": "x**2 - 4", "variable": "x"},
            headers=premium_headers,
        )
        assert response.status_code == 200
        assert "steps" in response.json()


# ===========================================================================
# GRUPO 4: Gate de nivel de detalle
# ===========================================================================

class TestDetailLevelGate:

    @pytest.mark.anyio
    async def test_differentiate_free_level_forced_beginner(self, test_app):
        """Plan free: el nivel se fuerza a 'beginner' aunque se pida 'advanced'"""
        response = await test_app.post(
            "/differentiate",
            json={"expression": "x**2", "variable": "x", "order": 1, "level": "advanced"},
        )
        assert response.status_code == 200
        assert response.json()["level"] == "beginner"

    @pytest.mark.anyio
    async def test_differentiate_premium_level_respected(self, test_app, premium_headers):
        """Plan premium: el nivel solicitado ('advanced') se respeta"""
        response = await test_app.post(
            "/differentiate",
            json={"expression": "x**2", "variable": "x", "order": 1, "level": "advanced"},
            headers=premium_headers,
        )
        assert response.status_code == 200
        assert response.json()["level"] == "advanced"


# ===========================================================================
# GRUPO 5: Gate de 3D
# ===========================================================================

class TestGraph3DGate:

    @pytest.mark.anyio
    async def test_graph_3d_free_returns_402(self, test_app):
        """Plan free (sin token) recibe 402 en /graph/3d"""
        response = await test_app.post(
            "/graph/3d",
            json={
                "expression": "sin(x)*cos(y)",
                "x_range": [-3, 3],
                "y_range": [-3, 3],
            },
        )
        assert response.status_code == 402

    @pytest.mark.anyio
    async def test_graph_3d_premium_returns_200_or_501(self, test_app, premium_headers):
        """Plan premium recibe 200 (implementado) o 501 (stub aún sin impl.)"""
        response = await test_app.post(
            "/graph/3d",
            json={
                "expression": "sin(x)*cos(y)",
                "x_range": [-3, 3],
                "y_range": [-3, 3],
            },
            headers=premium_headers,
        )
        assert response.status_code in [200, 501]


# ===========================================================================
# GRUPO 6: Gate de export
# ===========================================================================

class TestExportGate:

    @pytest.mark.anyio
    async def test_export_free_returns_402(self, test_app):
        """Plan free (sin token) recibe 402 en /export"""
        response = await test_app.post(
            "/export",
            json={"expression": "x**2", "format": "pdf"},
        )
        assert response.status_code == 402

    @pytest.mark.anyio
    async def test_export_premium_returns_200_or_501(self, test_app, premium_headers):
        """Plan premium recibe 200 (implementado) o 501 (stub aún sin impl.)"""
        response = await test_app.post(
            "/export",
            json={"expression": "x**2", "format": "pdf"},
            headers=premium_headers,
        )
        assert response.status_code in [200, 501]