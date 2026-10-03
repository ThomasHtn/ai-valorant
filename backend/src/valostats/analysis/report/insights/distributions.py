"""Distribution view: how a figure spreads for the squad in the period, against top ranked.

Every histogram uses fixed bins `[0, size), [size, 2 size)...` and a last open bin from `top_edge`, and
gives shares (counts / n) so samples of very different sizes compare. The analyst can narrow both
cohorts to one map and one side; a kill counts on the killer's side.
"""

import statistics
from collections import defaultdict
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from typing import Any

from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohort, ReportCohorts
from valostats.constants.agents import role_of
from valostats.constants.findings import DETONATION_DELAY_MS, ROUND_LENGTH_MS
from valostats.constants.game import UNITS_PER_METRE
from valostats.domain.enums import Side
from valostats.domain.facts import KillFact, PlayerMatchFact, PlayerRoundFact, RoundFact
from valostats.schemas.report.distributions import Distribution, Histogram, HistogramBin, PlayerHistogram

MS_PER_SECOND = 1000


@dataclass(frozen=True)
class DistributionScope:
    """Map and side the analyst narrowed the view to; None keeps every map or both sides."""

    map_name: str | None = None
    side: Side | None = None

    @property
    def cache_key(self) -> str:
        return f"distributions:{self.map_name or '*'}:{self.side or '*'}"

    def rounds(self, facts: Sequence[RoundFact]) -> list[RoundFact]:
        return [f for f in facts if self._map(f) and (self.side is None or f.side is self.side)]

    def player_rounds(self, facts: Sequence[PlayerRoundFact]) -> list[PlayerRoundFact]:
        return [f for f in facts if self._map(f) and (self.side is None or f.side is self.side)]

    def kills(self, facts: Sequence[KillFact]) -> list[KillFact]:
        # The killer plays the side opposite to the victim's.
        return [f for f in facts if self._map(f) and (self.side is None or f.victim_side is self.side.opposite)]

    def player_matches(self, facts: Sequence[PlayerMatchFact]) -> list[PlayerMatchFact]:
        return [f for f in facts if self._map(f)]

    def _map(self, fact: Any) -> bool:
        return self.map_name is None or fact.map_name == self.map_name


@dataclass(frozen=True)
class Binning:
    unit: str
    size: float
    # Start of the last, open bin.
    top_edge: float

    @property
    def count(self) -> int:
        return int(self.top_edge / self.size) + 1

    def index(self, value: float) -> int:
        return min(self.count - 1, max(0, int(value // self.size)))

    def bins(self) -> list[HistogramBin]:
        out = []
        for i in range(self.count):
            start = i * self.size
            last = i == self.count - 1
            label = f"{start:g}+ {self.unit}" if last else f"{start:g}-{start + self.size:g} {self.unit}"
            out.append(HistogramBin(start=start, end=None if last else start + self.size, label=label))
        return out


def histogram(values: Iterable[float | None], binning: Binning) -> Histogram:
    kept = [v for v in values if v is not None]
    counts = [0] * binning.count
    for value in kept:
        counts[binning.index(value)] += 1
    n = len(kept)
    return Histogram(
        counts=counts,
        shares=[round(c / n, 4) if n else None for c in counts],
        n=n,
        median=round(statistics.median(kept), 2) if kept else None,
    )


def distribution(key: str, label: str, binning: Binning, squad: Iterable[float | None], top: Iterable[float | None]) -> Distribution:
    return Distribution(
        key=key,
        label=label,
        unit=binning.unit,
        bin_size=binning.size,
        bins=binning.bins(),
        squad=histogram(squad, binning),
        top=histogram(top, binning),
    )


def round_length_ms(r: RoundFact) -> int:
    """Estimated end of a round: the spike timer after a detonation, the full round for a time-out, else the last event."""
    if r.result == "Detonate" and r.plant_ms is not None:
        return r.plant_ms + DETONATION_DELAY_MS
    if r.result == "" or (r.alive_end and r.opp_alive_end and r.result == "Elimination"):
        return ROUND_LENGTH_MS
    return r.last_event_ms


def one_per_round(rounds: Sequence[RoundFact]) -> list[RoundFact]:
    """Top ranked rounds are stored once per team: keep one fact per round for round-level figures."""
    seen: set[tuple[str, int]] = set()
    out = []
    for r in rounds:
        key = (r.match_id, r.round_index)
        if key not in seen:
            seen.add(key)
            out.append(r)
    return out


def distributions(cohorts: ReportCohorts, scope: DistributionScope | None = None) -> list[Distribution]:
    scope = scope or DistributionScope()
    squad_rounds = scope.rounds(cohorts.squad(FactKind.ROUNDS))
    top_rounds = scope.rounds(cohorts.select(FactKind.ROUNDS, ReportCohort.TOP))
    top_unique = one_per_round(top_rounds)
    squad_players = scope.player_rounds(cohorts.squad(FactKind.PLAYER_ROUNDS))
    top_players = scope.player_rounds(cohorts.select(FactKind.PLAYER_ROUNDS, ReportCohort.TOP))

    def seconds(ms: int | None) -> float | None:
        return ms / MS_PER_SECOND if ms is not None else None

    def attack_plant(rounds: Sequence[RoundFact]) -> list[float | None]:
        return [seconds(r.plant_ms) for r in rounds if r.side is Side.ATTACK and r.planted]

    out = [
        distribution("firstKillTime", "Temps du premier kill", Binning("s", 5, 90),
                     [seconds(r.first_kill_ms) for r in squad_rounds], [seconds(r.first_kill_ms) for r in top_unique]),
        distribution("plantTime", "Temps du plant", Binning("s", 5, 90), attack_plant(squad_rounds), attack_plant(top_rounds)),
        distribution("killDistance", "Distance des kills", Binning("m", 5, 50),
                     [k.distance / UNITS_PER_METRE for k in scope.kills(cohorts.squad(FactKind.KILLS)) if k.distance is not None],
                     [k.distance / UNITS_PER_METRE for k in scope.kills(cohorts.select(FactKind.KILLS, ReportCohort.TOP))
                      if k.distance is not None]),
        distribution("damageBeforeDeath", "Dégâts infligés avant la mort", Binning("dégâts", 25, 300),
                     [p.damage for p in squad_players if p.deaths], [p.damage for p in top_players if p.deaths]),
        _acs_distribution(cohorts, scope),
        distribution("roundDuration", "Durée des rounds", Binning("s", 5, 140),
                     [round_length_ms(r) / MS_PER_SECOND for r in squad_rounds],
                     [round_length_ms(r) / MS_PER_SECOND for r in top_unique]),
    ]  # fmt: skip
    return out


@dataclass(frozen=True)
class _MatchScore:
    """A player's score over the rounds of one match kept by the scope."""

    name: str
    agent: str
    score: int
    rounds: int


def acs(p: _MatchScore) -> float | None:
    return p.score / p.rounds if p.rounds else None


def _match_scores(cohorts: ReportCohorts, cohort: ReportCohort, scope: DistributionScope) -> list[_MatchScore]:
    """Per player and match; with a side, summed from that side's rounds since match facts have no side."""
    if scope.side is None:
        facts = scope.player_matches(cohorts.select(FactKind.PLAYER_MATCHES, cohort))
        return [_MatchScore(p.name, p.agent, p.score, p.rounds) for p in facts]
    grouped: dict[tuple[str, str], list[PlayerRoundFact]] = defaultdict(list)
    for p in scope.player_rounds(cohorts.select(FactKind.PLAYER_ROUNDS, cohort)):
        grouped[(p.match_id, p.puuid)].append(p)
    return [_MatchScore(g[0].name, g[0].agent, sum(p.score for p in g), len(g)) for g in grouped.values()]


def _acs_distribution(cohorts: ReportCohorts, scope: DistributionScope) -> Distribution:
    """ACS per match for the squad and for each player, against top ranked players of the same role."""
    binning = Binning("ACS", 25, 400)
    squad_matches = _match_scores(cohorts, ReportCohort.SQUAD, scope)
    top_matches = _match_scores(cohorts, ReportCohort.TOP, scope)
    names = {p.name for p in cohorts.players()}
    result = distribution(
        "acsPerMatch",
        "ACS par match",
        binning,
        [a for p in squad_matches if p.name in names and (a := acs(p)) is not None],
        [a for p in top_matches if (a := acs(p)) is not None],
    )
    top_by_role: dict[str, list[float]] = {}
    for p in top_matches:
        if (a := acs(p)) is not None:
            top_by_role.setdefault(role_of(p.agent), []).append(a)
    players = [
        PlayerHistogram(
            name=player.name,
            role=player.role,
            squad=histogram([a for p in squad_matches if p.name == player.name and (a := acs(p)) is not None], binning),
            top=histogram(top_by_role.get(player.role, []), binning),
        )
        for player in cohorts.players()
    ]
    return result.model_copy(update={"players": players})
