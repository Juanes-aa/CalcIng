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

    # CORS
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "https://calcing.netlify.app",
        "https://calcing.vercel.app",
    ]

    # JWT — sin default: deben venir de env o .env en producción
    JWT_PRIVATE_KEY: str = ""
    JWT_PUBLIC_KEY: str = ""


settings = Settings()