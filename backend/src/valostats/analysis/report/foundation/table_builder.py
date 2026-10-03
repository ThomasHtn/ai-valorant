"""Small builder for the coloured tables of the Tableaux view.

table = TableBuilder("results-maps", "Résultats par carte", "Carte", help="roundsWon")
table.column("rw", "Rounds gagnés", help="roundsWon", ref=Reference.HISTORY)
table.column("matches", "Matchs", ValueFormat.INTEGER, better=0, ref=Reference.NONE, min=0)
for map_name in cohorts.maps():
    table.row(map_name, map_name, {"rw": ..., "matches": ...}, art=map_art(map_name))
return table.build()
"""

from collections.abc import Mapping
from typing import Self

from valostats.constants.report import MIN_TEAM_SAMPLE
from valostats.domain.enums import Reference
from valostats.schemas.report.tables import GameArt, StatCell, StatColumn, StatRow, StatTable, ValueFormat


class TableBuilder:
    def __init__(self, table_id: str, title: str, rows_label: str, *, help: str | None = None, note: str | None = None) -> None:
        self._table_id = table_id
        self._title = title
        self._rows_label = rows_label
        self._help = help
        self._note = note
        self._columns: list[StatColumn] = []
        self._rows: list[StatRow] = []

    def column(
        self,
        key: str,
        label: str,
        value_format: ValueFormat = ValueFormat.PERCENT,
        better: int = 1,
        *,
        help: str | None = None,
        min: int = MIN_TEAM_SAMPLE,
        ref: Reference = Reference.TOP,
    ) -> Self:
        """Add a column. `better`: 1 higher is better, -1 lower is better, 0 never coloured."""
        self._columns.append(StatColumn(key=key, label=label, format=value_format, better=better, help=help, min=min, ref=ref))
        return self

    def count_column(self, key: str, label: str, *, help: str | None = None) -> Self:
        """A plain count: integer, never coloured."""
        return self.column(key, label, ValueFormat.INTEGER, 0, help=help, min=0, ref=Reference.NONE)

    def row(
        self,
        key: str,
        label: str,
        cells: Mapping[str, StatCell],
        *,
        art: GameArt | None = None,
        sub: str | None = None,
        total: bool = False,
    ) -> Self:
        """Add a row; `cells` is keyed by column key (a missing key shows as an empty cell)."""
        self._rows.append(StatRow(key=key, label=label, art=art, sub=sub, cells=dict(cells), total=total))
        return self

    def build(self) -> StatTable:
        return StatTable(
            id=self._table_id,
            title=self._title,
            rows_label=self._rows_label,
            help=self._help,
            note=self._note,
            columns=self._columns,
            rows=self._rows,
        )
