"""The squad's habits on each map and side, outside the session being reviewed."""

from collections import Counter
from collections.abc import Collection, Sequence
from dataclasses import dataclass

from valostats.constants.analysis import THROW_ADVANTAGE
from valostats.domain.enums import Cohort, KillerCohort, Side
from valostats.domain.facts import DeathFact, RoundFact
from valostats.schemas.common import Rate


@dataclass(frozen=True)
class SideHabits:
    matches: int
    opening_won: Rate
    traded: Rate
    plant_won: Rate
    throws_per_match: float
    first_death_spots: Counter[str]
    player_first_death_spots: Counter[tuple[str, str]]


def squad_side(death: DeathFact) -> Side:
    """Side of the squad in the round of this death."""
    return death.side if death.cohort is Cohort.SQUAD else death.side.opposite


def habits(rounds: Sequence[RoundFact], deaths: Sequence[DeathFact], exclude: Collection[str]) -> dict[tuple[str, Side], SideHabits]:
    rounds = [r for r in rounds if r.cohort is Cohort.SQUAD and r.match_id not in exclude]
    deaths = [d for d in deaths if d.match_id not in exclude and not d.teamkill]
    profile = {}
    for key in {(r.map_name, r.side) for r in rounds}:
        map_name, side = key
        rs = [r for r in rounds if (r.map_name, r.side) == key]
        squad = [d for d in deaths if d.cohort is Cohort.SQUAD and (d.map_name, d.side) == key]
        openings = [d for d in deaths if d.opening and d.map_name == map_name and squad_side(d) == side]
        planted = [r for r in rs if r.planted]
        matches = len({r.match_id for r in rs})
        profile[key] = SideHabits(
            matches=matches,
            opening_won=Rate(count=sum(d.killer_cohort is KillerCohort.SQUAD for d in openings), total=len(openings)),
            traded=Rate(count=sum(d.traded for d in squad), total=len(squad)),
            plant_won=Rate(count=sum(r.won for r in planted), total=len(planted)),
            throws_per_match=sum(r.max_advantage >= THROW_ADVANTAGE and not r.won for r in rs) / max(1, matches),
            first_death_spots=Counter(d.callout for d in squad if d.opening),
            player_first_death_spots=Counter((d.callout, d.name) for d in squad if d.opening),
        )
    return profile
