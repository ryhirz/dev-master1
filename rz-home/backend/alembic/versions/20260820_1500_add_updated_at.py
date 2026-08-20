"""add_updated_at_to_about_company_role_message

Revision ID: 20260820_1500_add_ts
Revises: b0ba7568f294
Create Date: 2026-08-20 15:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20260820_1500_add_ts"
down_revision: Union[str, None] = "b0ba7568f294"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # about_section: 补 created_at
    op.add_column(
        "about_section",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
    )
    # company_info: 补 created_at
    op.add_column(
        "company_info",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
    )
    # role: 补 created_at + updated_at
    op.add_column(
        "role",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
    )
    op.add_column(
        "role",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
    )
    # message: 补 updated_at
    op.add_column(
        "message",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("message", "updated_at")
    op.drop_column("role", "updated_at")
    op.drop_column("role", "created_at")
    op.drop_column("company_info", "created_at")
    op.drop_column("about_section", "created_at")