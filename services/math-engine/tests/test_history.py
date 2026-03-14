import pytest
from httpx import AsyncClient

# Helper reutilizable
async def register_and_login(client: AsyncClient,
                              email: str = "hist@example.com",
                              password: str = "SecurePass123!") -> dict:
    await client.post("/auth/register", json={"email": email,
                                               "password": password})
    response = await client.post("/auth/login", json={"email": email,
                                                       "password": password})
    return response.json()

class TestRequireAuth:
    @pytest.mark.anyio
    async def test_history_without_token_returns_401(self, test_app):
        """Sin Authorization header retorna 401"""
        response = await test_app.get("/users/me/history")
        assert response.status_code == 401

    @pytest.mark.anyio
    async def test_history_with_invalid_token_returns_401(self, test_app):
        """Token malformado retorna 401"""
        response = await test_app.get(
            "/users/me/history",
            headers={"Authorization": "Bearer token.invalido.aqui"}
        )
        assert response.status_code == 401

    @pytest.mark.anyio
    async def test_history_with_valid_token_returns_200(self, test_app):
        """Token válido retorna 200"""
        tokens = await register_and_login(test_app)
        response = await test_app.get(
            "/users/me/history",
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        assert response.status_code == 200

    @pytest.mark.anyio
    async def test_history_with_refresh_token_returns_401(self, test_app):
        """Refresh token NO es válido como access token"""
        tokens = await register_and_login(test_app, "refresh_as_access@example.com")
        response = await test_app.get(
            "/users/me/history",
            headers={"Authorization": f"Bearer {tokens['refresh_token']}"}
        )
        assert response.status_code == 401

class TestGetHistory:
    @pytest.mark.anyio
    async def test_empty_history(self, test_app):
        """Usuario sin cálculos retorna lista vacía"""
        tokens = await register_and_login(test_app, "empty@example.com")
        response = await test_app.get(
            "/users/me/history",
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["next_cursor"] is None

    @pytest.mark.anyio
    async def test_history_returns_saved_problems(self, test_app):
        """El historial contiene los cálculos guardados"""
        tokens = await register_and_login(test_app, "withprob@example.com")
        # Guardar un cálculo autenticado
        await test_app.post(
            "/solve",
            json={"expression": "2+2"},
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        response = await test_app.get(
            "/users/me/history",
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["expression"] == "2+2"

    @pytest.mark.anyio
    async def test_history_item_has_required_fields(self, test_app):
        """Cada item del historial tiene id, expression, result, type, created_at"""
        tokens = await register_and_login(test_app, "fields@example.com")
        await test_app.post(
            "/solve",
            json={"expression": "3+3"},
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        response = await test_app.get(
            "/users/me/history",
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        item = response.json()["items"][0]
        assert "id" in item
        assert "expression" in item
        assert "result" in item
        assert "type" in item
        assert "created_at" in item

    @pytest.mark.anyio
    async def test_unauthenticated_solve_not_saved(self, test_app):
        """Cálculo sin token NO se guarda en historial"""
        tokens = await register_and_login(test_app, "notsaved@example.com")
        # Llamada sin token
        await test_app.post("/solve", json={"expression": "9+9"})
        response = await test_app.get(
            "/users/me/history",
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        data = response.json()
        assert data["items"] == []

    @pytest.mark.anyio
    async def test_history_pagination_limit(self, test_app):
        """El parámetro limit controla cuántos items se retornan"""
        tokens = await register_and_login(test_app, "paginated@example.com")
        # Guardar 5 cálculos
        for i in range(5):
            await test_app.post(
                "/solve",
                json={"expression": f"{i}+1"},
                headers={"Authorization": f"Bearer {tokens['access_token']}"}
            )
        response = await test_app.get(
            "/users/me/history?limit=3",
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        data = response.json()
        assert len(data["items"]) == 3

    @pytest.mark.anyio
    async def test_history_next_cursor_present_when_more_items(self, test_app):
        """next_cursor no es null cuando hay más items"""
        tokens = await register_and_login(test_app, "cursor@example.com")
        for i in range(5):
            await test_app.post(
                "/solve",
                json={"expression": f"{i}+2"},
                headers={"Authorization": f"Bearer {tokens['access_token']}"}
            )
        response = await test_app.get(
            "/users/me/history?limit=3",
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        data = response.json()
        assert data["next_cursor"] is not None

    @pytest.mark.anyio
    async def test_history_cursor_paginates_correctly(self, test_app):
        """Usar cursor retorna la siguiente página sin repetir items"""
        tokens = await register_and_login(test_app, "cursor2@example.com")
        for i in range(5):
            await test_app.post(
                "/solve",
                json={"expression": f"{i}+3"},
                headers={"Authorization": f"Bearer {tokens['access_token']}"}
            )
        first = await test_app.get(
            "/users/me/history?limit=3",
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        cursor = first.json()["next_cursor"]
        second = await test_app.get(
            f"/users/me/history?limit=3&cursor={cursor}",
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        first_ids = {i["id"] for i in first.json()["items"]}
        second_ids = {i["id"] for i in second.json()["items"]}
        assert first_ids.isdisjoint(second_ids)

    @pytest.mark.anyio
    async def test_history_isolated_between_users(self, test_app):
        """El historial de un usuario no incluye cálculos de otro"""
        tokens_a = await register_and_login(test_app, "usera@example.com")
        tokens_b = await register_and_login(test_app, "userb@example.com")
        await test_app.post(
            "/solve",
            json={"expression": "1+1"},
            headers={"Authorization": f"Bearer {tokens_a['access_token']}"}
        )
        response = await test_app.get(
            "/users/me/history",
            headers={"Authorization": f"Bearer {tokens_b['access_token']}"}
        )
        assert response.json()["items"] == []