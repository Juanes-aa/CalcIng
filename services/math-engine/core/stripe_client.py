"""
core/stripe_client.py — Cliente Stripe configurado desde variables de entorno.
"""
import stripe
from core.config import settings

stripe.api_key = settings.STRIPE_SECRET_KEY


def get_stripe() -> stripe:
    """Retorna el módulo stripe ya configurado."""
    return stripe
