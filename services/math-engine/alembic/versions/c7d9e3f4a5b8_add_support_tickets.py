"""add_support_tickets

Revision ID: c7d9e3f4a5b8
Revises: b5e8a1f2d3c6
Create Date: 2026-04-27 13:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7d9e3f4a5b8'
down_revision: Union[str, None] = 'b5e8a1f2d3c6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('support_tickets',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=True),
        sa.Column('full_name', sa.String(200), nullable=False),
        sa.Column('eng_id', sa.String(100), nullable=False, server_default=''),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('critical', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('status', sa.String(20), nullable=False, server_default='open'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_support_tickets_user', 'support_tickets', ['user_id'])


def downgrade() -> None:
    op.drop_index('idx_support_tickets_user', table_name='support_tickets')
    op.drop_table('support_tickets')
