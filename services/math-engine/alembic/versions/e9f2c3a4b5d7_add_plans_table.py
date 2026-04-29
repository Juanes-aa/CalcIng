"""add_plans_table

Revision ID: e9f2c3a4b5d7
Revises: d8e4c1a9b7f3
Create Date: 2026-04-28 10:00:00.000000

Crea la tabla `plans` (catálogo de planes de suscripción) y seedea los tres
tiers iniciales: free, pro, enterprise. Los precios están en COP y los IDs
de Mercado Pago se leen de variables de entorno al momento de ejecutar la
migración; si no existen se dejan NULL y pueden llenarse por UPDATE luego.
"""
from __future__ import annotations

import os
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e9f2c3a4b5d7"
down_revision: Union[str, None] = "d8e4c1a9b7f3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_FREE_FEATURES: list[dict[str, object]] = [
    {"key": "pricing.free.f1", "included": True},
    {"key": "pricing.free.f2", "included": True},
    {"key": "pricing.free.f3", "included": False},
    {"key": "pricing.free.f4", "included": False},
]
_PRO_FEATURES: list[dict[str, object]] = [
    {"key": "pricing.pro.f1", "included": True},
    {"key": "pricing.pro.f2", "included": True},
    {"key": "pricing.pro.f3", "included": True},
    {"key": "pricing.pro.f4", "included": True},
    {"key": "pricing.pro.f5", "included": True},
]
_ENT_FEATURES: list[dict[str, object]] = [
    {"key": "pricing.enterprise.f1", "included": True},
    {"key": "pricing.enterprise.f2", "included": True},
    {"key": "pricing.enterprise.f3", "included": True},
    {"key": "pricing.enterprise.f4", "included": True},
    {"key": "pricing.enterprise.f5", "included": True},
]


def upgrade() -> None:
    op.create_table(
        "plans",
        sa.Column("tier", sa.String(50), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("subtitle_key", sa.String(120), nullable=True),
        sa.Column("currency", sa.String(3), nullable=False, server_default="COP"),
        sa.Column("price_monthly", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("price_annual", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("mp_plan_monthly_id", sa.String(200), nullable=True),
        sa.Column("mp_plan_annual_id", sa.String(200), nullable=True),
        sa.Column("features", sa.JSON(), nullable=False),
        sa.Column("cta_key", sa.String(120), nullable=True),
        sa.Column(
            "is_recommended",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    # Seed.
    plans_table = sa.table(
        "plans",
        sa.column("tier", sa.String),
        sa.column("name", sa.String),
        sa.column("subtitle_key", sa.String),
        sa.column("currency", sa.String),
        sa.column("price_monthly", sa.Integer),
        sa.column("price_annual", sa.Integer),
        sa.column("mp_plan_monthly_id", sa.String),
        sa.column("mp_plan_annual_id", sa.String),
        sa.column("features", sa.JSON),
        sa.column("cta_key", sa.String),
        sa.column("is_recommended", sa.Boolean),
        sa.column("is_active", sa.Boolean),
        sa.column("sort_order", sa.Integer),
    )

    op.bulk_insert(
        plans_table,
        [
            {
                "tier": "free",
                "name": "FREE",
                "subtitle_key": "pricing.free.sub",
                "currency": "COP",
                "price_monthly": 0,
                "price_annual": 0,
                "mp_plan_monthly_id": None,
                "mp_plan_annual_id": None,
                "features": _FREE_FEATURES,
                "cta_key": "pricing.free.cta",
                "is_recommended": False,
                "is_active": True,
                "sort_order": 0,
            },
            {
                "tier": "pro",
                "name": "PRO",
                "subtitle_key": "pricing.pro.sub",
                "currency": "COP",
                # Valores iniciales aproximados — editables por UPDATE o panel admin.
                # ~USD 9/mes y ~USD 7/mes (anual) convertidos a COP ~4.000.
                "price_monthly": 36000,
                "price_annual": 28000,
                "mp_plan_monthly_id": os.environ.get("MP_PLAN_PRO_MONTHLY") or None,
                "mp_plan_annual_id": os.environ.get("MP_PLAN_PRO_ANNUAL") or None,
                "features": _PRO_FEATURES,
                "cta_key": "pricing.pro.cta",
                "is_recommended": True,
                "is_active": True,
                "sort_order": 1,
            },
            {
                "tier": "enterprise",
                "name": "ENTERPRISE",
                "subtitle_key": "pricing.enterprise.sub",
                "currency": "COP",
                "price_monthly": 116000,
                "price_annual": 92000,
                "mp_plan_monthly_id": os.environ.get("MP_PLAN_ENTERPRISE_MONTHLY") or None,
                "mp_plan_annual_id": os.environ.get("MP_PLAN_ENTERPRISE_ANNUAL") or None,
                "features": _ENT_FEATURES,
                "cta_key": "pricing.enterprise.cta",
                "is_recommended": False,
                "is_active": True,
                "sort_order": 2,
            },
        ],
    )


def downgrade() -> None:
    op.drop_table("plans")
