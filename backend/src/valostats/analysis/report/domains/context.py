"""Domain "Contexte": lineups, each player's presence, evening order, start hour, weekday, opponent level, ranks, durations.

Every table compares the squad with its own history (rounds won in the same context before the
period). Rows stay honest when the data does not split: if every match starts between 21h and 23h,
the hour table has a single row.
"""

import statistics
from collections import Counter
from collections.abc import Callable, Sequence

from valostats.analysis.report.foundation.art import map_art
from valostats.analysis.report.foundation.cells import Measure, fixed
from valostats.analysis.report.foundation.cohort_cell import cohort_cell
from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohort, ReportCohorts
from valostats.analysis.report.foundation.table_builder import TableBuilder
from valostats.analysis.report.overview.evenings import evenings
from valostats.constants.context import (
    LAST_EVENING_RANK,
    NIGHT_END_H,
    PRIME_TIME_END_H,
    PRIME_TIME_START_H,
    SAME_LEVEL_TIERS,
    WEEKDAYS,
)
from valostats.constants.report import MIN_MATCH_SAMPLE
from valostats.domain.enums import Reference
from valostats.domain.facts import MatchFact, PlayerMatchFact
from valostats.schemas.report.tables import StatCell, StatTable, ValueFormat

MatchFilter = Callable[[MatchFact], bool]
# (row key, label, which matches, sub-label)
ContextRow = tuple[str, str, MatchFilter, str | None]
MS_PER_MINUTE = 60_000


def tables(cohorts: ReportCohorts) -> list[StatTable]:
    return [
        _lineups(cohorts),
        _with_without(cohorts),
        _evening_rank(cohorts),
        _start_hour(cohorts),
        _weekday(cohorts),
        _opponent_level(cohorts),
        _ranks(cohorts),
        _durations(cohorts),
    ]


def _squad_matches(cohorts: ReportCohorts) -> Sequence[MatchFact]:
    return cohorts.squad(FactKind.MATCHES)


def _rounds_won(cohorts: ReportCohorts, keep: MatchFilter, references: Sequence[ReportCohort] = (ReportCohort.HISTORY,)) -> StatCell:
    """Rounds won in the matches passing `keep`, for the period and (by default) the squad's history."""

    def measure(cohort: ReportCohort) -> Measure:
        matches = [m for m in cohorts.select(FactKind.MATCHES, cohort) if keep(m)]
        rounds = sum(m.rounds for m in matches)
        return (sum(m.rounds_won for m in matches) / rounds if rounds else None), rounds

    return cohort_cell(measure, references)


def _record(matches: Sequence[MatchFact]) -> StatCell:
    wins = sum(m.won for m in matches)
    return fixed(f"{wins}-{len(matches) - wins}", len(matches))


def _results_table(
    cohorts: ReportCohorts,
    table: TableBuilder,
    rows: Sequence[ContextRow],
    keep_empty: Sequence[str] = (),
    extra: Callable[[MatchFilter], dict[str, StatCell]] | None = None,
) -> StatTable:
    """Matches, record and rounds won (against the squad's history) for each context; empty rows dropped.

    `extra(keep)` adds the cells of columns the caller declared on `table` before calling.
    """
    table.count_column("matches", "Matchs").record_column().column("rw", "Rounds gagnés", help="roundsWon", ref=Reference.HISTORY)
    for key, label, keep, sub in rows:
        matches = [m for m in _squad_matches(cohorts) if keep(m)]
        if not matches and key not in keep_empty:
            continue
        cells = {"matches": fixed(len(matches)), "wl": _record(matches), "rw": _rounds_won(cohorts, keep)}
        table.row(key, label, cells | (extra(keep) if extra else {}), sub=sub)
    return table.build()


def _lineups(cohorts: ReportCohorts) -> StatTable:
    played = Counter(m.lineup for m in _squad_matches(cohorts))
    everyone = {name for lineup in played for name in lineup}
    rows: list[ContextRow] = []
    for lineup, _ in played.most_common():
        missing = sorted(everyone - set(lineup), key=str.lower)
        label = "Sans " + " et ".join(missing) if missing else "Tout le monde"
        rows.append(("-".join(lineup), label, _with_lineup(lineup), ", ".join(sorted(lineup, key=str.lower))))
    return _results_table(cohorts, TableBuilder("context-lineups", "Résultats par lineup", "Lineup", help="lineups"), rows)


def _with_lineup(lineup: tuple[str, ...]) -> MatchFilter:
    return lambda m: m.lineup == lineup


def _on_weekday(day: int) -> MatchFilter:
    return lambda m: m.started_at.weekday() == day


def _late(m: MatchFact) -> bool:
    return m.started_at.hour >= PRIME_TIME_END_H or m.started_at.hour < NIGHT_END_H


def _with_without(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("context-with-without", "Avec ou sans chaque joueur", "Joueur", help="withWithout")
        .count_column("mWith", "Matchs avec")
        .column("rwWith", "Rounds gagnés avec", help="withWithout", ref=Reference.NONE)
        .count_column("mWithout", "Matchs sans")
        .column("rwWithout", "Rounds gagnés sans", help="withWithout", ref=Reference.NONE)
    )
    matches = _squad_matches(cohorts)
    for player in cohorts.players():

        def has(m: MatchFact, name: str = player.name) -> bool:
            return name in m.lineup

        def has_not(m: MatchFact, name: str = player.name) -> bool:
            return name not in m.lineup

        table.row(
            player.name,
            player.name,
            {
                "mWith": fixed(sum(map(has, matches))),
                "rwWith": _rounds_won(cohorts, has, ()),
                "mWithout": fixed(sum(map(has_not, matches))),
                "rwWithout": _rounds_won(cohorts, has_not, ()),
            },
        )
    return table.build()


def _evening_rank(cohorts: ReportCohorts) -> StatTable:
    # Ranks come from every squad evening up to the end of the period, so history matches have one too.
    history = [*cohorts.select(FactKind.MATCHES, ReportCohort.HISTORY), *_squad_matches(cohorts)]
    rank = {m.match_id: i for evening in evenings(history) for i, m in enumerate(evening.matches, start=1)}
    rows: list[ContextRow] = [
        ("1", "1er match de la session", lambda m: rank.get(m.match_id) == 1, None),
        ("2", "2e match", lambda m: rank.get(m.match_id) == 2, None),
        ("3", "3e match", lambda m: rank.get(m.match_id) == 3, None),
        (str(LAST_EVENING_RANK), f"{LAST_EVENING_RANK}e match et plus", lambda m: rank.get(m.match_id, 0) >= LAST_EVENING_RANK, None),
    ]
    return _results_table(cohorts, TableBuilder("context-evening", "Rang du match dans la session", "Match", help="eveningRank"), rows)


def _start_hour(cohorts: ReportCohorts) -> StatTable:
    rows: list[ContextRow] = [
        ("early", f"Avant {PRIME_TIME_START_H}h", lambda m: NIGHT_END_H <= m.started_at.hour < PRIME_TIME_START_H, None),
        (
            "prime",
            f"Entre {PRIME_TIME_START_H}h et {PRIME_TIME_END_H}h",
            lambda m: PRIME_TIME_START_H <= m.started_at.hour < PRIME_TIME_END_H,
            None,
        ),
        (
            "late",
            f"À partir de {PRIME_TIME_END_H}h",
            _late,
            None,
        ),
    ]
    return _results_table(cohorts, TableBuilder("context-hour", "Heure de début", "Heure", help="startHour"), rows)


def _weekday(cohorts: ReportCohorts) -> StatTable:
    rows: list[ContextRow] = [(str(i), day, _on_weekday(i), None) for i, day in enumerate(WEEKDAYS)]
    return _results_table(cohorts, TableBuilder("context-weekday", "Jour de la semaine", "Jour", help="weekday"), rows)


def level_gap(match: MatchFact) -> float | None:
    """Opponents' average tier minus the squad's: positive when the opponents were higher ranked."""
    if match.tier is None or match.opp_tier is None:
        return None
    return match.opp_tier - match.tier


def _opponent_level(cohorts: ReportCohorts) -> StatTable:
    def gap_between(low: float, high: float) -> MatchFilter:
        return lambda m: (g := level_gap(m)) is not None and low <= g <= high

    rows: list[ContextRow] = [
        ("weaker", "Adversaires plus faibles", lambda m: (g := level_gap(m)) is not None and g < -SAME_LEVEL_TIERS, None),
        ("same", "Même niveau", gap_between(-SAME_LEVEL_TIERS, SAME_LEVEL_TIERS), None),
        ("stronger", "Adversaires plus forts", lambda m: (g := level_gap(m)) is not None and g > SAME_LEVEL_TIERS, None),
        ("unknown", "Niveau inconnu", lambda m: level_gap(m) is None, None),
    ]

    def mean_gap(keep: MatchFilter) -> dict[str, StatCell]:
        def measure(cohort: ReportCohort) -> Measure:
            gaps = [g for m in cohorts.select(FactKind.MATCHES, cohort) if keep(m) and (g := level_gap(m)) is not None]
            return (statistics.mean(gaps) if gaps else None), len(gaps)

        return {"gap": cohort_cell(measure, (ReportCohort.HISTORY,))}

    table = TableBuilder("context-level", "Niveau des adversaires", "Niveau", help="oppLevel").column(
        "gap", "Écart moyen de rang", ValueFormat.DECIMAL_1, 0, help="oppLevel", min=0, ref=Reference.HISTORY
    )
    return _results_table(cohorts, table, rows, keep_empty=("weaker", "same", "stronger"), extra=mean_gap)


def _ranks(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("context-ranks", "Rangs des joueurs", "Joueur", help="ranks")
        .column("first", "Rang en début de période", ValueFormat.TEXT, 0, ref=Reference.NONE, min=0)
        .column("current", "Rang actuel", ValueFormat.TEXT, 0, ref=Reference.NONE, min=0)
        .column("opp", "Rang moyen des adversaires", ValueFormat.TEXT, 0, help="ranks", ref=Reference.NONE, min=0)
        .count_column("matches", "Matchs")
    )
    tier_names = {
        p.tier_id: p.tier_name
        for c in ReportCohort
        for p in cohorts.select(FactKind.PLAYER_MATCHES, c)
        if p.tier_id is not None and p.tier_name
    }
    matches = {m.match_id: m for m in _squad_matches(cohorts)}
    for player in cohorts.players():
        ranked: list[PlayerMatchFact] = sorted(
            (p for p in cohorts.squad(FactKind.PLAYER_MATCHES) if p.name == player.name and p.tier_name), key=lambda p: p.started_at
        )
        opponents = [t for p in ranked if (m := matches.get(p.match_id)) and (t := m.opp_tier) is not None]
        mean_tier = statistics.mean(opponents) if opponents else None
        table.row(
            player.name,
            player.name,
            {
                "first": fixed(ranked[0].tier_name if ranked else None, len(ranked)),
                "current": fixed(ranked[-1].tier_name if ranked else None, len(ranked)),
                "opp": fixed(tier_names.get(round(mean_tier)) if mean_tier is not None else None, len(opponents)),
                "matches": fixed(len(ranked)),
            },
        )
    return table.build()


def _durations(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("context-duration", "Durée des matchs et serveurs", "Carte", help="duration")
        .count_column("matches", "Matchs")
        .column("dur", "Durée médiane (min)", ValueFormat.DECIMAL_1, 0, help="duration", min=MIN_MATCH_SAMPLE)
        .column("servers", "Serveurs", ValueFormat.TEXT, 0, ref=Reference.NONE, min=0)
    )

    def cells(**equal: str) -> dict[str, StatCell]:
        matches: Sequence[MatchFact] = cohorts.squad(FactKind.MATCHES, **equal)
        servers = Counter(m.cluster or "?" for m in matches)

        def minutes(cohort: ReportCohort) -> Measure:
            lengths = [m.length_ms / MS_PER_MINUTE for m in cohorts.select(FactKind.MATCHES, cohort, **equal) if m.length_ms]
            return (statistics.median(lengths) if lengths else None), len(lengths)

        return {
            "matches": fixed(len(matches)),
            "dur": cohort_cell(minutes),
            "servers": fixed(", ".join(f"{s} {n}" for s, n in servers.most_common()), len(matches)),
        }

    for map_name in cohorts.maps():
        table.row(map_name, map_name, cells(map_name=map_name), art=map_art(map_name))
    table.row("all", "Toutes les cartes", cells(), total=True)
    return table.build()
