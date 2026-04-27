import pytest
from httpx import AsyncClient


async def register_and_login(client: AsyncClient,
                              email: str = "proj@example.com",
                              password: str = "SecurePass123!") -> dict:
    await client.post("/auth/register", json={"email": email,
                                               "password": password})
    response = await client.post("/auth/login", json={"email": email,
                                                       "password": password})
    return response.json()


def auth_header(tokens: dict) -> dict:
    return {"Authorization": f"Bearer {tokens['access_token']}"}


class TestProjectsAuth:
    @pytest.mark.anyio
    async def test_list_without_token_returns_401(self, test_app):
        response = await test_app.get("/projects")
        assert response.status_code == 401

    @pytest.mark.anyio
    async def test_create_without_token_returns_401(self, test_app):
        response = await test_app.post("/projects", json={"name": "Test"})
        assert response.status_code == 401

    @pytest.mark.anyio
    async def test_get_without_token_returns_401(self, test_app):
        response = await test_app.get("/projects/some-uuid")
        assert response.status_code == 401

    @pytest.mark.anyio
    async def test_patch_without_token_returns_401(self, test_app):
        response = await test_app.patch("/projects/some-uuid", json={"name": "X"})
        assert response.status_code == 401

    @pytest.mark.anyio
    async def test_delete_without_token_returns_401(self, test_app):
        response = await test_app.delete("/projects/some-uuid")
        assert response.status_code == 401


class TestCreateProject:
    @pytest.mark.anyio
    async def test_create_returns_201(self, test_app):
        tokens = await register_and_login(test_app, "create1@example.com")
        response = await test_app.post(
            "/projects",
            json={"name": "Mi Proyecto", "description": "Desc"},
            headers=auth_header(tokens),
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Mi Proyecto"
        assert data["description"] == "Desc"
        assert data["data"] == {}
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    @pytest.mark.anyio
    async def test_create_with_empty_name_returns_422(self, test_app):
        tokens = await register_and_login(test_app, "create2@example.com")
        response = await test_app.post(
            "/projects",
            json={"name": "   "},
            headers=auth_header(tokens),
        )
        assert response.status_code == 422

    @pytest.mark.anyio
    async def test_create_without_description_defaults_empty(self, test_app):
        tokens = await register_and_login(test_app, "create3@example.com")
        response = await test_app.post(
            "/projects",
            json={"name": "Solo nombre"},
            headers=auth_header(tokens),
        )
        assert response.status_code == 201
        assert response.json()["description"] == ""


class TestListProjects:
    @pytest.mark.anyio
    async def test_empty_list(self, test_app):
        tokens = await register_and_login(test_app, "list1@example.com")
        response = await test_app.get("/projects", headers=auth_header(tokens))
        assert response.status_code == 200
        assert response.json()["items"] == []

    @pytest.mark.anyio
    async def test_list_returns_created_projects(self, test_app):
        tokens = await register_and_login(test_app, "list2@example.com")
        await test_app.post("/projects", json={"name": "P1"}, headers=auth_header(tokens))
        await test_app.post("/projects", json={"name": "P2"}, headers=auth_header(tokens))
        response = await test_app.get("/projects", headers=auth_header(tokens))
        items = response.json()["items"]
        assert len(items) == 2

    @pytest.mark.anyio
    async def test_list_isolated_between_users(self, test_app):
        tokens_a = await register_and_login(test_app, "listA@example.com")
        tokens_b = await register_and_login(test_app, "listB@example.com")
        await test_app.post("/projects", json={"name": "P-A"}, headers=auth_header(tokens_a))
        response = await test_app.get("/projects", headers=auth_header(tokens_b))
        assert response.json()["items"] == []


class TestGetProject:
    @pytest.mark.anyio
    async def test_get_existing_project(self, test_app):
        tokens = await register_and_login(test_app, "get1@example.com")
        create_resp = await test_app.post(
            "/projects", json={"name": "Detalle"}, headers=auth_header(tokens)
        )
        pid = create_resp.json()["id"]
        response = await test_app.get(f"/projects/{pid}", headers=auth_header(tokens))
        assert response.status_code == 200
        assert response.json()["name"] == "Detalle"

    @pytest.mark.anyio
    async def test_get_nonexistent_returns_404(self, test_app):
        tokens = await register_and_login(test_app, "get2@example.com")
        import uuid
        fake_id = str(uuid.uuid4())
        response = await test_app.get(f"/projects/{fake_id}", headers=auth_header(tokens))
        assert response.status_code == 404

    @pytest.mark.anyio
    async def test_get_other_users_project_returns_404(self, test_app):
        tokens_a = await register_and_login(test_app, "getA@example.com")
        tokens_b = await register_and_login(test_app, "getB@example.com")
        create_resp = await test_app.post(
            "/projects", json={"name": "Privado"}, headers=auth_header(tokens_a)
        )
        pid = create_resp.json()["id"]
        response = await test_app.get(f"/projects/{pid}", headers=auth_header(tokens_b))
        assert response.status_code == 404


class TestUpdateProject:
    @pytest.mark.anyio
    async def test_update_name(self, test_app):
        tokens = await register_and_login(test_app, "upd1@example.com")
        create_resp = await test_app.post(
            "/projects", json={"name": "Original"}, headers=auth_header(tokens)
        )
        pid = create_resp.json()["id"]
        response = await test_app.patch(
            f"/projects/{pid}",
            json={"name": "Nuevo nombre"},
            headers=auth_header(tokens),
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Nuevo nombre"

    @pytest.mark.anyio
    async def test_update_description(self, test_app):
        tokens = await register_and_login(test_app, "upd2@example.com")
        create_resp = await test_app.post(
            "/projects", json={"name": "P", "description": "old"}, headers=auth_header(tokens)
        )
        pid = create_resp.json()["id"]
        response = await test_app.patch(
            f"/projects/{pid}",
            json={"description": "nueva desc"},
            headers=auth_header(tokens),
        )
        assert response.status_code == 200
        assert response.json()["description"] == "nueva desc"

    @pytest.mark.anyio
    async def test_update_data_jsonb(self, test_app):
        tokens = await register_and_login(test_app, "upd3@example.com")
        create_resp = await test_app.post(
            "/projects", json={"name": "P"}, headers=auth_header(tokens)
        )
        pid = create_resp.json()["id"]
        payload = {"data": {"expressions": ["2+2"], "results": ["4"]}}
        response = await test_app.patch(
            f"/projects/{pid}", json=payload, headers=auth_header(tokens)
        )
        assert response.status_code == 200
        assert response.json()["data"] == payload["data"]

    @pytest.mark.anyio
    async def test_update_empty_name_returns_422(self, test_app):
        tokens = await register_and_login(test_app, "upd4@example.com")
        create_resp = await test_app.post(
            "/projects", json={"name": "P"}, headers=auth_header(tokens)
        )
        pid = create_resp.json()["id"]
        response = await test_app.patch(
            f"/projects/{pid}", json={"name": "  "}, headers=auth_header(tokens)
        )
        assert response.status_code == 422

    @pytest.mark.anyio
    async def test_update_nonexistent_returns_404(self, test_app):
        tokens = await register_and_login(test_app, "upd5@example.com")
        import uuid
        fake_id = str(uuid.uuid4())
        response = await test_app.patch(
            f"/projects/{fake_id}", json={"name": "X"}, headers=auth_header(tokens)
        )
        assert response.status_code == 404


class TestDeleteProject:
    @pytest.mark.anyio
    async def test_delete_returns_204(self, test_app):
        tokens = await register_and_login(test_app, "del1@example.com")
        create_resp = await test_app.post(
            "/projects", json={"name": "Borrar"}, headers=auth_header(tokens)
        )
        pid = create_resp.json()["id"]
        response = await test_app.delete(f"/projects/{pid}", headers=auth_header(tokens))
        assert response.status_code == 204

    @pytest.mark.anyio
    async def test_delete_removes_from_list(self, test_app):
        tokens = await register_and_login(test_app, "del2@example.com")
        create_resp = await test_app.post(
            "/projects", json={"name": "Borrar2"}, headers=auth_header(tokens)
        )
        pid = create_resp.json()["id"]
        await test_app.delete(f"/projects/{pid}", headers=auth_header(tokens))
        list_resp = await test_app.get("/projects", headers=auth_header(tokens))
        assert list_resp.json()["items"] == []

    @pytest.mark.anyio
    async def test_delete_nonexistent_returns_404(self, test_app):
        tokens = await register_and_login(test_app, "del3@example.com")
        import uuid
        fake_id = str(uuid.uuid4())
        response = await test_app.delete(f"/projects/{fake_id}", headers=auth_header(tokens))
        assert response.status_code == 404

    @pytest.mark.anyio
    async def test_delete_other_users_project_returns_404(self, test_app):
        tokens_a = await register_and_login(test_app, "delA@example.com")
        tokens_b = await register_and_login(test_app, "delB@example.com")
        create_resp = await test_app.post(
            "/projects", json={"name": "Privado"}, headers=auth_header(tokens_a)
        )
        pid = create_resp.json()["id"]
        response = await test_app.delete(f"/projects/{pid}", headers=auth_header(tokens_b))
        assert response.status_code == 404
