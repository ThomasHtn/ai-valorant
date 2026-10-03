"""squad player portrait: the avatar agent picked in ValoQuests

Run `uv run valostats sync` afterwards to fill it.

Revision ID: 0003
Revises: 0002
Create Date: 2026-10-03 18:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0003"
down_revision: str | Sequence[str] | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("squad_player", sa.Column("portrait", sa.String(length=32), nullable=True))


def downgrade() -> None:
    op.drop_column("squad_player", "portrait")
