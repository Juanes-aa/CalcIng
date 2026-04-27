"""migrate_stripe_to_mercadopago

Revision ID: d8e4c1a9b7f3
Revises: c7d9e3f4a5b8
Create Date: 2026-04-27 17:15:00.000000

Migra el modelo de billing de Stripe a Mercado Pago.

Cambios en la tabla `users`:
- Drop columna `stripe_customer_id` (Text, unique).
- Add columna `mp_customer_email` (String(255), indexed).
- Add columna `mp_subscription_id` (String(100), unique).

NOTA: como CalcIng aún no tiene usuarios pagos en producción al momento de
esta migración, se elimina `stripe_customer_id` directamente. Para una DB
con datos vivos habría que mantener la columna en una primera migración y
borrarla en una segunda tras validar la transición.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd8e4c1a9b7f3'
down_revision: Union[str, None] = 'c7d9e3f4a5b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('mp_customer_email', sa.String(255), nullable=True),
    )
    op.add_column(
        'users',
        sa.Column('mp_subscription_id', sa.String(100), nullable=True),
    )
    op.create_index(
        'ix_users_mp_customer_email', 'users', ['mp_customer_email']
    )
    with op.batch_alter_table('users') as batch_op:
        batch_op.create_unique_constraint(
            'uq_users_mp_subscription_id', ['mp_subscription_id']
        )
        batch_op.drop_constraint('uq_users_stripe_customer_id', type_='unique')
    op.drop_column('users', 'stripe_customer_id')


def downgrade() -> None:
    op.add_column(
        'users',
        sa.Column('stripe_customer_id', sa.Text(), nullable=True),
    )
    with op.batch_alter_table('users') as batch_op:
        batch_op.create_unique_constraint(
            'uq_users_stripe_customer_id', ['stripe_customer_id']
        )
        batch_op.drop_constraint('uq_users_mp_subscription_id', type_='unique')
    op.drop_index('ix_users_mp_customer_email', table_name='users')
    op.drop_column('users', 'mp_subscription_id')
    op.drop_column('users', 'mp_customer_email')
