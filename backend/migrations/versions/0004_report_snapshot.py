"""report snapshot: report views stored once per facts build

Revision ID: 0004
Revises: 0003
Create Date: 2026-10-04 16:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0004"
down_revision: str | Sequence[str] | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "report_snapshot",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("period", sa.String(length=32), nullable=False),
        sa.Column("view", sa.String(length=96), nullable=False),
        sa.Column("squad_version", sa.Integer(), nullable=False),
        sa.Column("top_version", sa.Integer(), nullable=False),
        sa.Column("code_version", sa.String(length=16), nullable=False),
        sa.Column("payload", sa.Text(), nullable=False),
        sa.Column("computed_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_report_snapshot")),
        sa.UniqueConstraint(
            "period", "view", "squad_version", "top_version", "code_version", name=op.f("uq_report_snapshot_period")
        ),
    )


def downgrade() -> None:
    op.drop_table("report_snapshot")
