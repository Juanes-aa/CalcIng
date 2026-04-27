"""add_billing_columns

Revision ID: a3f7b2c1d4e5
Revises: 9e6defcafdc7
Create Date: 2026-04-27 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3f7b2c1d4e5'
down_revision: Union[str, None] = '9e6defcafdc7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('stripe_customer_id', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('plan_expires_at', sa.DateTime(timezone=True), nullable=True))
    with op.batch_alter_table('users') as batch_op:
        batch_op.create_unique_constraint('uq_users_stripe_customer_id', ['stripe_customer_id'])


def downgrade() -> None:
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_constraint('uq_users_stripe_customer_id', type_='unique')
    op.drop_column('users', 'plan_expires_at')
    op.drop_column('users', 'stripe_customer_id')
