"""The four groups of facts every report figure is computed on, indexed for fast filtering.

- squad: the squad in the period.
- opp: its opponents in the same matches.
- hist: the squad before the period (its own history).
- top: top ranked matches (every collected one, whatever the period).

Kill facts appear twice: `deaths` groups them by the victim's cohort ("our deaths"), `kills` by the
killer's ("our kills"). Teamkills and environment kills (spike, fall) are left out of both.
"""

from collections import Counter, defaultdict
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any

from valostats.analysis.report.foundation.period_selection import Dated, FactFilter, PeriodWindow
from valostats.constants.agents import role_of
from valostats.domain.enums import Cohort, KillerCohort
from valostats.domain.facts import KillFact, MatchFact, PlayerMatchFact, PlayerRoundFact, RoundFact


class FactKind(StrEnum):
    MATCHES = "matches"
    ROUNDS = "rounds"
    # Kill facts seen from the victim's team.
    DEATHS = "deaths"
    # Kill facts seen from the killer's team.
    KILLS = "kills"
    PLAYER_ROUNDS = "player_rounds"
    PLAYER_MATCHES = "player_matches"


class ReportCohort(StrEnum):
    SQUAD = "squad"
    OPPONENTS = "opp"
    HISTORY = "hist"
    TOP = "top"


# The references a squad value is compared with, in the order the front lists them.
REFERENCE_COHORTS = (ReportCohort.TOP, ReportCohort.OPPONENTS, ReportCohort.HISTORY)


class FactIndex:
    """Facts of one cohort, with every `select` memoised by the fields it filters on.

    The first `select(rounds, map_name="Split")` groups all rounds by map once; every later call on
    another map is a dictionary lookup. This keeps the 370k top ranked player-rounds fast to slice.
    """

    def __init__(self, facts: dict[FactKind, Sequence[Any]]) -> None:
        self._facts = facts
        self._groups: dict[tuple[FactKind, tuple[str, ...]], dict[tuple[Any, ...], list[Any]]] = {}

    def all(self, kind: FactKind) -> Sequence[Any]:
        return self._facts.get(kind, ())

    def select(self, kind: FactKind, **equal: Any) -> Sequence[Any]:
        """Facts whose fields equal the given values, e.g. `select(FactKind.ROUNDS, map_name="Split", side=Side.ATTACK)`."""
        if not equal:
            return self.all(kind)
        fields = tuple(sorted(equal))
        key = (kind, fields)
        if key not in self._groups:
            groups: dict[tuple[Any, ...], list[Any]] = defaultdict(list)
            for fact in self.all(kind):
                groups[tuple(getattr(fact, f) for f in fields)].append(fact)
            self._groups[key] = dict(groups)
        return self._groups[key].get(tuple(equal[f] for f in fields), [])


def build_index(
    matches: Iterable[MatchFact],
    rounds: Iterable[RoundFact],
    kills: Iterable[KillFact],
    player_rounds: Iterable[PlayerRoundFact],
    player_matches: Iterable[PlayerMatchFact],
    cohort: Cohort,
    keep: FactFilter = lambda _: True,
) -> FactIndex:
    """Index the facts of one fact cohort (squad, opp or top) that pass `keep` (a period filter)."""
    killer_cohort = KillerCohort(cohort.value)
    clean_kills = [k for k in kills if not k.teamkill and k.killer_cohort is not KillerCohort.ENVIRONMENT and keep(k)]
    return FactIndex(
        {
            FactKind.MATCHES: [m for m in matches if m.cohort is cohort and keep(m)],
            FactKind.ROUNDS: [r for r in rounds if r.cohort is cohort and keep(r)],
            FactKind.DEATHS: [k for k in clean_kills if k.victim_cohort is cohort],
            FactKind.KILLS: [k for k in clean_kills if k.killer_cohort is killer_cohort],
            FactKind.PLAYER_ROUNDS: [p for p in player_rounds if p.cohort is cohort and keep(p)],
            FactKind.PLAYER_MATCHES: [p for p in player_matches if p.cohort is cohort and keep(p)],
        }
    )


@dataclass(frozen=True)
class SquadPlayer:
    """A squad player of the period: his avatar agent, and his role from his most played agent."""

    name: str
    puuid: str
    portrait: str
    role: str


@dataclass
class ReportCohorts:
    """Everything a report view needs: the period and its four indexed cohorts."""

    window: PeriodWindow
    indexes: dict[ReportCohort, FactIndex]
    # Agent of every player in every match of every cohort, to know a killer's or victim's role.
    agents: dict[tuple[str, str], str] = field(default_factory=dict)
    # Puuid -> avatar agent picked in ValoQuests; players without one show their most played agent.
    portraits: Mapping[str, str] = field(default_factory=dict)

    def select(self, kind: FactKind, cohort: ReportCohort, **equal: Any) -> Sequence[Any]:
        return self.indexes[cohort].select(kind, **equal)

    def squad(self, kind: FactKind, **equal: Any) -> Sequence[Any]:
        return self.select(kind, ReportCohort.SQUAD, **equal)

    def role_of_player(self, match_id: str, puuid: str) -> str:
        """Role of the agent a player played in a match (any cohort)."""
        return role_of(self.agents.get((match_id, puuid)))

    def maps(self) -> list[str]:
        """Maps the squad played in the period, alphabetical."""
        return sorted({m.map_name for m in self.squad(FactKind.MATCHES)})

    def matches(self) -> list[MatchFact]:
        """Squad matches of the period, oldest first."""
        return sorted(self.squad(FactKind.MATCHES), key=lambda m: m.started_at)

    def players(self) -> list[SquadPlayer]:
        """Squad players of the period, alphabetical (case-insensitive), with their avatar and role."""
        played: Counter[tuple[str, str, str]] = Counter((p.name, p.puuid, p.agent) for p in self.squad(FactKind.PLAYER_MATCHES))
        main: dict[str, SquadPlayer] = {}
        for (name, puuid, agent), _ in played.most_common():
            portrait = self.portraits.get(puuid, agent)
            main.setdefault(puuid, SquadPlayer(name=name, puuid=puuid, portrait=portrait, role=role_of(agent)))
        return sorted(main.values(), key=lambda p: p.name.lower())

    def player(self, name: str) -> SquadPlayer | None:
        return next((p for p in self.players() if p.name == name), None)


def build_cohorts(
    window: PeriodWindow,
    squad_facts: Mapping[FactKind, Sequence[Any]],
    top_index: FactIndex,
    portraits: Mapping[str, str] | None = None,
) -> ReportCohorts:
    """Split the squad matches' facts into squad / opp / hist for the period; reuse the shared top index.

    `squad_facts` holds the facts of the squad's matches (both teams) by kind: MATCHES, ROUNDS, KILLS
    (all kills of those matches), PLAYER_ROUNDS, PLAYER_MATCHES.
    """
    in_period = [m.started_at for m in squad_facts[FactKind.MATCHES] if m.cohort is Cohort.SQUAD and window.includes(m)]
    start = min(in_period) if in_period else None

    def before(fact: Dated) -> bool:
        return start is not None and fact.started_at < start

    def index(cohort: Cohort, keep: FactFilter) -> FactIndex:
        return build_index(
            squad_facts[FactKind.MATCHES],
            squad_facts[FactKind.ROUNDS],
            squad_facts[FactKind.KILLS],
            squad_facts[FactKind.PLAYER_ROUNDS],
            squad_facts[FactKind.PLAYER_MATCHES],
            cohort,
            keep,
        )

    agents = {(p.match_id, p.puuid): p.agent for p in squad_facts[FactKind.PLAYER_MATCHES]}
    agents.update({(p.match_id, p.puuid): p.agent for p in top_index.all(FactKind.PLAYER_MATCHES)})
    return ReportCohorts(
        window=window,
        indexes={
            ReportCohort.SQUAD: index(Cohort.SQUAD, window.includes),
            ReportCohort.OPPONENTS: index(Cohort.OPPONENT, window.includes),
            ReportCohort.HISTORY: index(Cohort.SQUAD, before),
            ReportCohort.TOP: top_index,
        },
        agents=agents,
        portraits=portraits or {},
    )
