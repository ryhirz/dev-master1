"""add_admin_user_updated_at

Revision ID: 20260821_add_au_ts
Revises: 20260820_1500_add_ts
Create Date: 2026-08-21 09:30:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20260821_add_au_ts"
down_revision: Union[str, None] = "20260820_1500_add_ts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # admin_user: 补 updated_at（此前缺失，导致后台"修改时间"列恒为空）
    op.add_column(
        "admin_user",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("admin_user", "updated_at")
