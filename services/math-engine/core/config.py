from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Concurrencia
    MAX_WORKERS: int = 4

    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    CACHE_TTL_SECONDS: int = 3600
    RATE_LIMIT_PER_MINUTE: int = 60

    # Entorno
    APP_ENV: str = "development"

    # Base de datos
    DATABASE_URL: str = "sqlite+aiosqlite:///./calcIng_dev.db"

    # CORS — solo orígenes explícitos. La regex de localhost se activa SÓLO en dev.
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "https://calcing.netlify.app",
        "https://calcing.vercel.app",
    ]

    # Hosts confiables (Host header). En producción se aplica strict matching.
    TRUSTED_HOSTS: list[str] = [
        "calcing.onrender.com",
        "*.onrender.com",
        "localhost",
        "127.0.0.1",
        "testserver",
        "test",
    ]

    # Límite de tamaño de body (DoS prevention). 64 KiB es generoso para una API CAS.
    MAX_REQUEST_BODY_BYTES: int = 65536

    # Auth: complejidad mínima de password
    PASSWORD_MIN_LENGTH: int = 8

    # JWT — sin default: deben venir de env o .env en producción
    JWT_PRIVATE_KEY: str = ""
    JWT_PUBLIC_KEY: str = ""

    # Mercado Pago
    MP_ACCESS_TOKEN: str = ""
    MP_WEBHOOK_SECRET: str = ""
    MP_PLAN_PRO_MONTHLY: str = ""
    MP_PLAN_PRO_ANNUAL: str = ""
    MP_PLAN_ENTERPRISE_MONTHLY: str = ""
    MP_PLAN_ENTERPRISE_ANNUAL: str = ""

    @model_validator(mode="after")
    def _enforce_production_invariants(self) -> "Settings":
        """En producción, refuerza requisitos críticos de seguridad.

        - JWT_PRIVATE_KEY y JWT_PUBLIC_KEY DEBEN estar definidas (sin fallback efímero).
        - MP_ACCESS_TOKEN y MP_WEBHOOK_SECRET DEBEN estar definidos.
        - Los 4 plan IDs de Mercado Pago DEBEN estar definidos.
        - DATABASE_URL no puede ser SQLite local.
        """
        if self.APP_ENV != "production":
            return self
        missing: list[str] = []
        if not self.JWT_PRIVATE_KEY:
            missing.append("JWT_PRIVATE_KEY")
        if not self.JWT_PUBLIC_KEY:
            missing.append("JWT_PUBLIC_KEY")
        if not self.MP_ACCESS_TOKEN:
            missing.append("MP_ACCESS_TOKEN")
        if not self.MP_WEBHOOK_SECRET:
            missing.append("MP_WEBHOOK_SECRET")
        if not self.MP_PLAN_PRO_MONTHLY:
            missing.append("MP_PLAN_PRO_MONTHLY")
        if not self.MP_PLAN_PRO_ANNUAL:
            missing.append("MP_PLAN_PRO_ANNUAL")
        if not self.MP_PLAN_ENTERPRISE_MONTHLY:
            missing.append("MP_PLAN_ENTERPRISE_MONTHLY")
        if not self.MP_PLAN_ENTERPRISE_ANNUAL:
            missing.append("MP_PLAN_ENTERPRISE_ANNUAL")
        if self.DATABASE_URL.startswith("sqlite"):
            missing.append("DATABASE_URL (sqlite no permitido en producción)")
        if missing:
            raise RuntimeError(
                "Configuración insegura en APP_ENV=production. Faltan: "
                + ", ".join(missing)
            )
        return self


settings = Settings()