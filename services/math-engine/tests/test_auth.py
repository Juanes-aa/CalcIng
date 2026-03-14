import pytest
from httpx import AsyncClient

class TestRegister:
    @pytest.mark.anyio
    async def test_register_success(self, test_app):
        """Registro exitoso retorna 201 con email"""
        response = await test_app.post("/auth/register", json={
            "email": "new@example.com",
            "password": "SecurePass123!"
        })
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "new@example.com"
        assert "id" in data
        assert "password" not in data
        assert "password_hash" not in data

    @pytest.mark.anyio
    async def test_register_duplicate_email(self, test_app):
        """Email duplicado retorna 409"""
        payload = {"email": "dup@example.com", "password": "SecurePass123!"}
        await test_app.post("/auth/register", json=payload)
        response = await test_app.post("/auth/register", json=payload)
        assert response.status_code == 409

    @pytest.mark.anyio
    async def test_register_invalid_email(self, test_app):
        """Email inválido retorna 422"""
        response = await test_app.post("/auth/register", json={
            "email": "not-an-email",
            "password": "SecurePass123!"
        })
        assert response.status_code == 422

    @pytest.mark.anyio
    async def test_register_short_password(self, test_app):
        """Password menor a 8 caracteres retorna 422"""
        response = await test_app.post("/auth/register", json={
            "email": "short@example.com",
            "password": "abc"
        })
        assert response.status_code == 422

    @pytest.mark.anyio
    async def test_register_password_not_returned(self, test_app):
        """La respuesta nunca incluye password ni password_hash"""
        response = await test_app.post("/auth/register", json={
            "email": "safe@example.com",
            "password": "SecurePass123!"
        })
        body = response.text
        assert "password" not in body

class TestLogin:
    @pytest.mark.anyio
    async def test_login_success(self, test_app):
        """Login exitoso retorna access_token y refresh_token"""
        await test_app.post("/auth/register", json={
            "email": "login@example.com",
            "password": "SecurePass123!"
        })
        response = await test_app.post("/auth/login", json={
            "email": "login@example.com",
            "password": "SecurePass123!"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.anyio
    async def test_login_wrong_password(self, test_app):
        """Password incorrecto retorna 401"""
        await test_app.post("/auth/register", json={
            "email": "wrong@example.com",
            "password": "SecurePass123!"
        })
        response = await test_app.post("/auth/login", json={
            "email": "wrong@example.com",
            "password": "WrongPassword!"
        })
        assert response.status_code == 401

    @pytest.mark.anyio
    async def test_login_nonexistent_user(self, test_app):
        """Usuario inexistente retorna 401"""
        response = await test_app.post("/auth/login", json={
            "email": "ghost@example.com",
            "password": "SecurePass123!"
        })
        assert response.status_code == 401

    @pytest.mark.anyio
    async def test_access_token_is_jwt(self, test_app):
        """El access_token tiene formato JWT (tres partes separadas por punto)"""
        await test_app.post("/auth/register", json={
            "email": "jwt@example.com",
            "password": "SecurePass123!"
        })
        response = await test_app.post("/auth/login", json={
            "email": "jwt@example.com",
            "password": "SecurePass123!"
        })
        token = response.json()["access_token"]
        parts = token.split(".")
        assert len(parts) == 3

class TestRefresh:
    @pytest.mark.anyio
    async def test_refresh_success(self, test_app):
        """Refresh válido retorna nuevo access_token"""
        await test_app.post("/auth/register", json={
            "email": "refresh@example.com",
            "password": "SecurePass123!"
        })
        login_response = await test_app.post("/auth/login", json={
            "email": "refresh@example.com",
            "password": "SecurePass123!"
        })
        refresh_token = login_response.json()["refresh_token"]
        response = await test_app.post("/auth/refresh", json={
            "refresh_token": refresh_token
        })
        assert response.status_code == 200
        assert "access_token" in response.json()

    @pytest.mark.anyio
    async def test_refresh_invalid_token(self, test_app):
        """Token inválido retorna 401"""
        response = await test_app.post("/auth/refresh", json={
            "refresh_token": "token.invalido.aqui"
        })
        assert response.status_code == 401

    @pytest.mark.anyio
    async def test_refresh_returns_new_token(self, test_app):
        """El nuevo access_token es diferente al original"""
        await test_app.post("/auth/register", json={
            "email": "newtoken@example.com",
            "password": "SecurePass123!"
        })
        login = await test_app.post("/auth/login", json={
            "email": "newtoken@example.com",
            "password": "SecurePass123!"
        })
        original_token = login.json()["access_token"]
        refresh_token = login.json()["refresh_token"]

        import asyncio
        await asyncio.sleep(1)

        refresh = await test_app.post("/auth/refresh", json={
            "refresh_token": refresh_token
        })
        new_token = refresh.json()["access_token"]
        assert new_token != original_token