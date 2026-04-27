import pytest
from httpx import AsyncClient


async def register_and_login(client: AsyncClient,
                              email: str = "support@example.com",
                              password: str = "SecurePass123!") -> dict:
    await client.post("/auth/register", json={"email": email,
                                               "password": password})
    response = await client.post("/auth/login", json={"email": email,
                                                       "password": password})
    return response.json()


def auth_header(tokens: dict) -> dict:
    return {"Authorization": f"Bearer {tokens['access_token']}"}


VALID_TICKET = {
    "full_name": "Juan Pérez",
    "eng_id": "ENG-001",
    "category": "bug",
    "description": "El cálculo de integrales no funciona correctamente.",
    "critical": False,
}


class TestSubmitTicket:
    @pytest.mark.anyio
    async def test_submit_without_auth_returns_201(self, test_app):
        """Tickets se pueden crear sin autenticación"""
        response = await test_app.post("/support", json=VALID_TICKET)
        assert response.status_code == 201
        data = response.json()
        assert data["full_name"] == "Juan Pérez"
        assert data["category"] == "bug"
        assert data["description"] == "El cálculo de integrales no funciona correctamente."
        assert data["critical"] is False
        assert data["status"] == "open"
        assert "id" in data
        assert "created_at" in data

    @pytest.mark.anyio
    async def test_submit_with_auth_returns_201(self, test_app):
        """Tickets autenticados también se crean correctamente"""
        tokens = await register_and_login(test_app, "support_auth@example.com")
        response = await test_app.post(
            "/support", json=VALID_TICKET, headers=auth_header(tokens)
        )
        assert response.status_code == 201
        assert response.json()["full_name"] == "Juan Pérez"

    @pytest.mark.anyio
    async def test_submit_critical_ticket(self, test_app):
        ticket = {**VALID_TICKET, "critical": True}
        response = await test_app.post("/support", json=ticket)
        assert response.status_code == 201
        assert response.json()["critical"] is True

    @pytest.mark.anyio
    async def test_submit_with_empty_eng_id(self, test_app):
        ticket = {**VALID_TICKET, "eng_id": ""}
        response = await test_app.post("/support", json=ticket)
        assert response.status_code == 201
        assert response.json()["eng_id"] == ""

    @pytest.mark.anyio
    async def test_submit_without_description_returns_422(self, test_app):
        ticket = {"full_name": "Test", "category": "bug"}
        response = await test_app.post("/support", json=ticket)
        assert response.status_code == 422

    @pytest.mark.anyio
    async def test_submit_without_full_name_returns_422(self, test_app):
        ticket = {"description": "Something", "category": "bug"}
        response = await test_app.post("/support", json=ticket)
        assert response.status_code == 422

    @pytest.mark.anyio
    async def test_submit_without_category_returns_422(self, test_app):
        ticket = {"full_name": "Test", "description": "Something"}
        response = await test_app.post("/support", json=ticket)
        assert response.status_code == 422

    @pytest.mark.anyio
    async def test_status_defaults_to_open(self, test_app):
        response = await test_app.post("/support", json=VALID_TICKET)
        assert response.json()["status"] == "open"

    @pytest.mark.anyio
    async def test_different_categories(self, test_app):
        for cat in ["bug", "feature", "question", "billing"]:
            ticket = {**VALID_TICKET, "category": cat}
            response = await test_app.post("/support", json=ticket)
            assert response.status_code == 201
            assert response.json()["category"] == cat
