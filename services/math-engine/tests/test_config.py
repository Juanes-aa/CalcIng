"""
Tests para core/config.py — configuración centralizada de variables de entorno.
Todos estos tests deben fallar (rojo) hasta que se implemente Settings.
"""
import pytest
from unittest.mock import patch
import os


class TestSettingsDefaults:
    """Verifica que Settings expone los campos correctos con defaults seguros."""

    def test_settings_importable(self):
        from core.config import Settings  # noqa: F401

    def test_settings_instance_importable(self):
        from core.config import settings  # noqa: F401

    def test_max_workers_default(self):
        from core.config import settings
        assert settings.MAX_WORKERS == 4

    def test_max_workers_type(self):
        from core.config import settings
        assert isinstance(settings.MAX_WORKERS, int)

    def test_app_env_default(self) -> None:
        from core.config import Settings
        field = Settings.model_fields["APP_ENV"]
        assert field.default == "development"

    def test_database_url_field_exists(self):
        from core.config import settings
        assert hasattr(settings, "DATABASE_URL")

    def test_jwt_private_key_field_exists(self):
        from core.config import settings
        assert hasattr(settings, "JWT_PRIVATE_KEY")

    def test_jwt_public_key_field_exists(self):
        from core.config import settings
        assert hasattr(settings, "JWT_PUBLIC_KEY")


class TestSettingsFromEnv:
    """Verifica que Settings lee correctamente desde variables de entorno."""

    def test_max_workers_from_env(self):
        with patch.dict(os.environ, {"MAX_WORKERS": "8"}):
            from core.config import Settings
            s = Settings()
            assert s.MAX_WORKERS == 8

    def test_app_env_from_env(self):
        with patch.dict(os.environ, {"APP_ENV": "production"}):
            from core.config import Settings
            s = Settings()
            assert s.APP_ENV == "production"

    def test_database_url_from_env(self):
        test_url = "sqlite+aiosqlite:///./test_override.db"
        with patch.dict(os.environ, {"DATABASE_URL": test_url}):
            from core.config import Settings
            s = Settings()
            assert s.DATABASE_URL == test_url

    def test_jwt_private_key_from_env(self):
        fake_key = "-----BEGIN RSA PRIVATE KEY-----\nfake\n-----END RSA PRIVATE KEY-----"
        with patch.dict(os.environ, {"JWT_PRIVATE_KEY": fake_key}):
            from core.config import Settings
            s = Settings()
            assert s.JWT_PRIVATE_KEY == fake_key

    def test_jwt_public_key_from_env(self):
        fake_key = "-----BEGIN PUBLIC KEY-----\nfake\n-----END PUBLIC KEY-----"
        with patch.dict(os.environ, {"JWT_PUBLIC_KEY": fake_key}):
            from core.config import Settings
            s = Settings()
            assert s.JWT_PUBLIC_KEY == fake_key


class TestSettingsIntegration:
    """Verifica que los módulos existentes consumen settings en lugar de hardcodear."""

    def test_database_module_uses_settings(self):
        import inspect
        import db.database as db_module
        source = inspect.getsource(db_module)
        assert "from core.config import settings" in source or \
               "from core.config import Settings" in source, \
               "db/database.py debe importar settings desde core.config"

    def test_keys_module_uses_settings(self):
        import inspect
        import core.keys as keys_module
        source = inspect.getsource(keys_module)
        assert "from core.config import settings" in source or \
               "from core.config import Settings" in source, \
               "core/keys.py debe importar settings desde core.config"

    def test_math_router_uses_settings(self):
        import inspect
        import routers.math as math_module
        source = inspect.getsource(math_module)
        assert "from core.config import settings" in source or \
               "from core.config import Settings" in source, \
               "routers/math.py debe importar settings desde core.config"

    def test_max_workers_not_hardcoded_in_math_router(self):
        import inspect
        import routers.math as math_module
        source = inspect.getsource(math_module)
        assert "max_workers=4" not in source, \
               "routers/math.py no debe tener max_workers=4 hardcodeado"