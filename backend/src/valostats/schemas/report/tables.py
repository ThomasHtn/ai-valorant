"""Coloured statistics tables of the Tableaux view: one set of tables per domain of the metrics dictionary.

A table never carries colours. Each cell gives the squad value, its sample, and the same metric for
every reference (top ranked, opponents, squad history); the front picks the reference the analyst
chose and colours the cell with the column's rule (`better`, `min`, `ref`).
"""

from enum import StrEnum

from valostats.domain.enums import Reference
from valostats.schemas.common import ApiModel


class ValueFormat(StrEnum):
    """How the front formats a value."""

    PERCENT = "pct"  # 0..1 shown as 48 %
    INTEGER = "int"
    DECIMAL_1 = "dec1"
    DECIMAL_2 = "dec2"
    SECONDS = "sec"
    METRES = "m"
    CREDITS = "cr"
    TEXT = "text"


class ArtType(StrEnum):
    """Kind of game picture shown in front of a row; the front builds the image path from the slug."""

    MAP = "map"
    AGENT = "agent"
    WEAPON = "weapon"
    ROLE = "role"
    PLAYER = "player"


class GameArt(ApiModel):
    type: ArtType
    # Lower case name with non-alphanumerics as "-", e.g. "kay-o"; for a player, his name.
    slug: str


CellValue = float | int | str | None


class StatCell(ApiModel):
    """A squad value with its sample, and the same metric for each reference cohort (None when not computed)."""

    v: CellValue
    # Sample behind the value: rounds, deaths, duels... depending on the metric.
    n: int | None = None
    top: CellValue = None
    top_n: int | None = None
    opp: CellValue = None
    opp_n: int | None = None
    hist: CellValue = None
    hist_n: int | None = None


class StatColumn(ApiModel):
    key: str
    label: str
    format: ValueFormat
    # 1 higher is better, -1 lower is better, 0 neutral (never coloured).
    better: int
    # Glossary key of the "i" tip, see the front's core/help.
    help: str | None = None
    # Sample under which the cell stays grey.
    min: int = 0
    # Reference used for the colour; NONE for plain counts. TOP follows the analyst's choice of reference.
    ref: Reference = Reference.TOP


class StatRow(ApiModel):
    key: str
    label: str
    art: GameArt | None = None
    sub: str | None = None
    cells: dict[str, StatCell]
    # Summary row ("Toutes les cartes"), kept last when sorting.
    total: bool = False


class StatTable(ApiModel):
    id: str
    title: str
    rows_label: str
    help: str | None = None
    note: str | None = None
    columns: list[StatColumn]
    rows: list[StatRow]


class DomainTables(ApiModel):
    """Every table of one domain (Résultats, Ouvertures, Combat...)."""

    key: str
    label: str
    tables: list[StatTable]
