"""Tendance view: the squad over its whole history, by month, by patch and match by match.

The period of the report only decides which points are highlighted. Top ranked values are given for
the metrics where that reference means something: symmetric metrics (rounds won, pistols, first blood
taken over both sides) are always 50 % in top ranked, so they have none.
"""

from collections import defaultdict
from collections.abc import Callable, Iterable, Sequence
from dataclasses import dataclass
from typing import Any, Protocol

from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohort, ReportCohorts
from valostats.analysis.report.foundation.period_selection import patch_sort_key
from valostats.analysis.report.insights.findings import is_bonus_round
from valostats.constants.agents import role_of
from valostats.domain.enums import BuyType, Cohort, Side
from valostats.domain.facts import KillFact, MatchFact, PlayerMatchFact, PlayerRoundFact, RoundFact
from valostats.schemas.report.tables import ValueFormat
from valostats.schemas.report.trends import (
    MatchPoint,
    PatchMarker,
    PlayerTrend,
    PlayerTrendPoint,
    TrendMetric,
    TrendPoint,
    Trends,
    TrendValue,
)


class History(Protocol):
    """The squad's whole history (both teams of its matches), as the facts store keeps it."""

    @property
    def matches(self) -> Sequence[MatchFact]: ...

    @property
    def rounds(self) -> Sequence[RoundFact]: ...

    @property
    def kills(self) -> Sequence[KillFact]: ...

    @property
    def player_rounds(self) -> Sequence[PlayerRoundFact]: ...

    @property
    def player_matches(self) -> Sequence[PlayerMatchFact]: ...

    @property
    def squad(self) -> set[str]: ...


Measure = Callable[["Facts"], TrendValue]


@dataclass(frozen=True)
class Facts:
    """The facts behind one point: rounds and deaths of the team, player-rounds of its players."""

    rounds: Sequence[RoundFact]
    deaths: Sequence[KillFact]
    players: Sequence[PlayerRoundFact]


@dataclass(frozen=True)
class MetricSpec:
    key: str
    label: str
    format: ValueFormat
    better: int
    help: str | None
    measure: Measure
    # False for symmetric metrics: top ranked is 50 % by construction.
    has_top: bool = True


def rate[T](facts: Iterable[T], success: Callable[[T], bool], among: Callable[[T], bool] | None = None) -> TrendValue:
    base = [f for f in facts if among is None or among(f)]
    return TrendValue(v=round(sum(1 for f in base if success(f)) / len(base), 4) if base else None, n=len(base))


def _per_round(players: Sequence[PlayerRoundFact], value: Callable[[PlayerRoundFact], float]) -> TrendValue:
    return TrendValue(v=round(sum(value(p) for p in players) / len(players), 4) if players else None, n=len(players))


def _kd(players: Sequence[PlayerRoundFact]) -> TrendValue:
    deaths = sum(p.deaths for p in players)
    return TrendValue(v=round(sum(p.kills for p in players) / deaths, 4) if deaths else None, n=len(players))


def _headshots(players: Sequence[PlayerRoundFact]) -> TrendValue:
    shots = sum(p.shots for p in players)
    return TrendValue(v=round(sum(p.headshots for p in players) / shots, 4) if shots else None, n=shots)


def _won(r: Any) -> bool:
    return bool(r.won)


TEAM_METRICS = [
    MetricSpec("roundsWon", "Rounds gagnés", ValueFormat.PERCENT, 1, "roundsWon", lambda f: rate(f.rounds, _won), has_top=False),
    MetricSpec("attack", "Rounds gagnés en attaque", ValueFormat.PERCENT, 1, "sideRounds",
               lambda f: rate(f.rounds, _won, lambda r: r.side is Side.ATTACK)),
    MetricSpec("defense", "Rounds gagnés en défense", ValueFormat.PERCENT, 1, "sideRounds",
               lambda f: rate(f.rounds, _won, lambda r: r.side is Side.DEFENSE)),
    MetricSpec("pistols", "Pistols gagnés", ValueFormat.PERCENT, 1, "pistols",
               lambda f: rate(f.rounds, _won, lambda r: r.buy is BuyType.PISTOL), has_top=False),
    MetricSpec("firstBlood", "First blood pris", ValueFormat.PERCENT, 1, None,
               lambda f: rate(f.rounds, lambda r: r.first_kill is True, lambda r: r.first_kill is not None), has_top=False),
    MetricSpec("wonAfterFirstBlood", "Rounds gagnés après first blood", ValueFormat.PERCENT, 1, None,
               lambda f: rate(f.rounds, _won, lambda r: r.first_kill is True)),
    MetricSpec("wonAfterFirstDeath", "Rounds gagnés après first death", ValueFormat.PERCENT, 1, None,
               lambda f: rate(f.rounds, _won, lambda r: r.first_kill is False)),
    MetricSpec("postPlant", "Post-plants gagnés", ValueFormat.PERCENT, 1, None,
               lambda f: rate(f.rounds, _won, lambda r: r.side is Side.ATTACK and r.planted)),
    MetricSpec("retake", "Retakes réussies", ValueFormat.PERCENT, 1, None,
               lambda f: rate(f.rounds, _won, lambda r: r.side is Side.DEFENSE and r.planted)),
    MetricSpec("revengeDeaths", "Morts avec revenge", ValueFormat.PERCENT, 1, None, lambda f: rate(f.deaths, lambda k: k.avenged)),
    MetricSpec("bonusRound", "R3 bonus gagnés", ValueFormat.PERCENT, 1, "roundTypes", lambda f: rate(f.rounds, _won, is_bonus_round)),
    MetricSpec("acs", "ACS", ValueFormat.DECIMAL_1, 1, "acs", lambda f: _per_round(f.players, lambda p: p.score)),
    MetricSpec("kd", "K/D", ValueFormat.DECIMAL_2, 1, "kd", lambda f: _kd(f.players)),
    MetricSpec("kast", "KAST", ValueFormat.PERCENT, 1, "kast", lambda f: rate(f.players, lambda p: p.kast)),
    MetricSpec("headshots", "HS %", ValueFormat.PERCENT, 1, None, lambda f: _headshots(f.players)),
]  # fmt: skip

PLAYER_METRICS = [
    MetricSpec("acs", "ACS", ValueFormat.DECIMAL_1, 1, "acs", lambda f: _per_round(f.players, lambda p: p.score)),
    MetricSpec("kd", "K/D", ValueFormat.DECIMAL_2, 1, "kd", lambda f: _kd(f.players)),
    MetricSpec("kast", "KAST", ValueFormat.PERCENT, 1, "kast", lambda f: rate(f.players, lambda p: p.kast)),
    MetricSpec("headshots", "HS %", ValueFormat.PERCENT, 1, None, lambda f: _headshots(f.players)),
    MetricSpec("firstDeathsPerRound", "First deaths par round", ValueFormat.DECIMAL_2, -1, None,
               lambda f: _per_round(f.players, lambda p: p.first_death)),
    MetricSpec("firstBloodsPerRound", "First bloods par round", ValueFormat.DECIMAL_2, 1, None,
               lambda f: _per_round(f.players, lambda p: p.first_blood)),
]  # fmt: skip


def trends(cohorts: ReportCohorts, history: History) -> Trends:
    """Trends over the squad's whole history (`history` is the store's SquadFacts)."""
    squad_names = {p.name for p in cohorts.players()} | _squad_names(history)
    matches = sorted((m for m in history.matches if m.cohort is Cohort.SQUAD), key=lambda m: m.started_at)
    facts = Facts(
        rounds=[r for r in history.rounds if r.cohort is Cohort.SQUAD],
        deaths=[k for k in history.kills if k.victim_cohort is Cohort.SQUAD and not k.teamkill],
        players=[p for p in history.player_rounds if p.cohort is Cohort.SQUAD and p.name in squad_names],
    )
    in_period = {m.match_id for m in matches if cohorts.window.includes(m)}
    top = _top_facts(cohorts)
    by_month = _points(matches, facts, lambda f: f"{f.started_at:%Y-%m}", in_period)
    by_patch = _points(matches, facts, lambda f: f.patch, in_period)
    by_patch.sort(key=lambda p: patch_sort_key(p.key))
    series, markers = _series(matches, history.player_matches, squad_names, in_period)
    return Trends(
        metrics=[_metric(spec, top) for spec in TEAM_METRICS],
        player_metrics=[_metric(spec, None) for spec in PLAYER_METRICS],
        by_month=by_month,
        by_patch=by_patch,
        players=_players(cohorts, facts, in_period),
        series=series,
        patch_markers=markers,
    )


def _squad_names(history: History) -> set[str]:
    return {p.name for p in history.player_matches if p.cohort is Cohort.SQUAD and p.puuid in history.squad}


def _top_facts(cohorts: ReportCohorts) -> Facts:
    return Facts(
        rounds=cohorts.select(FactKind.ROUNDS, ReportCohort.TOP),
        deaths=cohorts.select(FactKind.DEATHS, ReportCohort.TOP),
        players=cohorts.select(FactKind.PLAYER_ROUNDS, ReportCohort.TOP),
    )


def _metric(spec: MetricSpec, top: Facts | None) -> TrendMetric:
    reference = spec.measure(top).v if top is not None and spec.has_top else None
    return TrendMetric(key=spec.key, label=spec.label, format=spec.format, better=spec.better, help=spec.help, top=reference)


def _group[T](facts: Iterable[T], key: Callable[[T], str]) -> dict[str, list[T]]:
    grouped: dict[str, list[T]] = defaultdict(list)
    for fact in facts:
        grouped[key(fact)].append(fact)
    return grouped


def _points(matches: Sequence[MatchFact], facts: Facts, key: Callable[[Any], str], in_period: set[str]) -> list[TrendPoint]:
    """One point per month or patch, oldest first."""
    matches_by = _group(matches, key)
    rounds_by, deaths_by, players_by = _group(facts.rounds, key), _group(facts.deaths, key), _group(facts.players, key)
    points = []
    for k in sorted(matches_by):
        group = Facts(rounds_by.get(k, []), deaths_by.get(k, []), players_by.get(k, []))
        points.append(
            TrendPoint(
                key=k,
                matches=len(matches_by[k]),
                wins=sum(m.won for m in matches_by[k]),
                values={spec.key: spec.measure(group) for spec in TEAM_METRICS},
                in_period=any(m.match_id in in_period for m in matches_by[k]),
            )
        )
    return points


def _players(cohorts: ReportCohorts, facts: Facts, in_period: set[str]) -> list[PlayerTrend]:
    """Each squad player of the period by month, with top ranked players of his main role as reference."""
    top_players = cohorts.select(FactKind.PLAYER_ROUNDS, ReportCohort.TOP)
    top_by_role = _group(top_players, lambda p: role_of(p.agent))
    out = []
    for player in cohorts.players():
        mine = _group((p for p in facts.players if p.name == player.name), lambda p: f"{p.started_at:%Y-%m}")
        role_facts = Facts((), (), top_by_role.get(player.role, []))
        out.append(
            PlayerTrend(
                name=player.name,
                role=player.role,
                top={spec.key: spec.measure(role_facts).v for spec in PLAYER_METRICS},
                by_month=[
                    PlayerTrendPoint(
                        key=month,
                        values={spec.key: spec.measure(Facts((), (), rows)) for spec in PLAYER_METRICS},
                        in_period=any(p.match_id in in_period for p in rows),
                    )
                    for month, rows in sorted(mine.items())
                ],
            )
        )
    return out


def _series(
    matches: Sequence[MatchFact], player_matches: Iterable[PlayerMatchFact], squad_names: set[str], in_period: set[str]
) -> tuple[list[MatchPoint], list[PatchMarker]]:
    """Every squad match, oldest first, with each squad player's ACS and the patch changes."""
    acs: dict[str, dict[str, float]] = defaultdict(dict)
    for p in player_matches:
        if p.cohort is Cohort.SQUAD and p.name in squad_names and p.rounds:
            acs[p.match_id][p.name] = round(p.score / p.rounds, 1)
    points, markers = [], []
    previous: str | None = None
    for index, m in enumerate(matches):
        change = previous is not None and m.patch != previous
        points.append(
            MatchPoint(
                index=index,
                match_id=m.match_id,
                day=m.started_at.date(),
                map_name=m.map_name,
                patch=m.patch,
                won=m.won,
                rounds_won=m.rounds_won,
                rounds_lost=m.rounds_lost,
                acs=acs.get(m.match_id, {}),
                patch_change=change,
                in_period=m.match_id in in_period,
            )
        )
        if change or index == 0:
            markers.append(PatchMarker(index=index, patch=m.patch, day=m.started_at.date()))
        previous = m.patch
    return points, markers
