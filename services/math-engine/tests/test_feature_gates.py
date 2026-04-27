import uuid
import pytest
from datetime import datetime, timedelta, timezone
from jose import jwt
from core.keys import get_private_key

# ---------------------------------------------------------------------------
# Fixture local: genera headers con plan=="pro" o "enterprise"
# No usa create_access_token() porque su firma es create_access_token(subject: str)
# y no acepta claims extra. Se replica la lógica internamente agregando "plan".
# ---------------------------------------------------------------------------

ALGORITHM = "RS256"
ACCESS_TOKEN_TTL_MINUTES = 60


def _make_plan_token(plan: str = "pro") -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_TTL_MINUTES)
    payload = {
        "sub": str(uuid.uuid4()),
        "exp": expire,
        "type": "access",
        "plan": plan,
    }
    return jwt.encode(payload, get_private_key(), algorithm=ALGORITHM)


@pytest.fixture
def premium_headers() -> dict:
    token = _make_plan_token("pro")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def enterprise_headers() -> dict:
    token = _make_plan_token("enterprise")
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
    async def test_differentiate_pro_gets_all_steps(self, test_app, premium_headers):
        """Plan pro recibe todos los steps en /differentiate"""
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
    async def test_integrate_pro_gets_all_steps(self, test_app, premium_headers):
        """Plan pro recibe todos los steps en /integrate"""
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
    async def test_solve_equation_pro_gets_all_steps(self, test_app, premium_headers):
        """Plan pro recibe todos los steps en /solve-equation"""
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
    async def test_differentiate_pro_level_respected(self, test_app, premium_headers):
        """Plan pro: el nivel solicitado ('advanced') se respeta"""
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
    async def test_graph_3d_pro_returns_200(self, test_app, premium_headers):
        """Plan pro recibe 200 con imagen base64"""
        response = await test_app.post(
            "/graph/3d",
            json={
                "expression": "x**2 + y**2",
                "x_range": [-2, 2],
                "y_range": [-2, 2],
                "resolution": 15,
            },
            headers=premium_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "image_base64" in data
        assert len(data["image_base64"]) > 100

    @pytest.mark.anyio
    async def test_graph_3d_enterprise_returns_200(self, test_app, enterprise_headers):
        """Plan enterprise también tiene acceso a graph 3D"""
        response = await test_app.post(
            "/graph/3d",
            json={
                "expression": "x + y",
                "x_range": [-1, 1],
                "y_range": [-1, 1],
                "resolution": 10,
            },
            headers=enterprise_headers,
        )
        assert response.status_code == 200


# ===========================================================================
# GRUPO 6: Gate de export
# ===========================================================================

class TestExportGate:

    @pytest.mark.anyio
    async def test_export_free_returns_402(self, test_app):
        """Plan free (sin token) recibe 402 en /export"""
        response = await test_app.post(
            "/export",
            json={"expression": "x**2", "format": "latex"},
        )
        assert response.status_code == 402

    @pytest.mark.anyio
    async def test_export_latex_returns_200(self, test_app, premium_headers):
        """Plan pro recibe 200 con LaTeX"""
        response = await test_app.post(
            "/export",
            json={"expression": "x**2 + 1", "format": "latex"},
            headers=premium_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["format"] == "latex"
        assert "x" in data["content"]

    @pytest.mark.anyio
    async def test_export_png_returns_200(self, test_app, premium_headers):
        """Plan pro recibe 200 con PNG base64"""
        response = await test_app.post(
            "/export",
            json={"expression": "x**2", "format": "png"},
            headers=premium_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["format"] == "png"
        assert len(data["content"]) > 100