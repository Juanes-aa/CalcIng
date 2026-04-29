from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from core.config import settings

_PRIVATE_KEY_ENV = "JWT_PRIVATE_KEY"
_PUBLIC_KEY_ENV = "JWT_PUBLIC_KEY"

# Cache del par generado en memoria — se genera una sola vez por proceso
_cached_private_pem: bytes | None = None
_cached_public_pem: bytes | None = None


def _generate_rsa_pair() -> tuple[bytes, bytes]:
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption(),
    )
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    return private_pem, public_pem


def _ensure_cached_pair() -> None:
    global _cached_private_pem, _cached_public_pem
    if _cached_private_pem is None:
        # En producción NUNCA aceptar par efímero: revela una misconfig grave
        # (rotación al reiniciar invalida sesiones; clave nunca rotada por humano).
        if settings.APP_ENV == "production":
            raise RuntimeError(
                "JWT_PRIVATE_KEY/JWT_PUBLIC_KEY no configuradas en producción. "
                "El par RSA efímero está deshabilitado por seguridad."
            )
        _cached_private_pem, _cached_public_pem = _generate_rsa_pair()


def _normalize_pem(raw: str) -> bytes:
    """Convierte una PEM string a bytes normalizando saltos de línea.

    Algunas plataformas (Render, Heroku, etc.) almacenan variables de entorno
    multilínea como una sola línea con '\n' literales (dos caracteres:
    backslash + n). `cryptography` no puede parsear esos PEMs. Aquí
    des-escapamos de forma idempotente: si ya hay saltos reales, no se tocan.
    """
    return raw.replace("\\n", "\n").encode()


def get_private_key() -> bytes:
    val = settings.JWT_PRIVATE_KEY
    if val:
        return _normalize_pem(val)
    _ensure_cached_pair()
    return _cached_private_pem  # type: ignore[return-value]


def get_public_key() -> bytes:
    val = settings.JWT_PUBLIC_KEY
    if val:
        return _normalize_pem(val)
    private_val = settings.JWT_PRIVATE_KEY
    if private_val:
        from cryptography.hazmat.primitives.serialization import load_pem_private_key
        pk = load_pem_private_key(_normalize_pem(private_val), password=None)
        return pk.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
    _ensure_cached_pair()
    return _cached_public_pem  # type: ignore[return-value]