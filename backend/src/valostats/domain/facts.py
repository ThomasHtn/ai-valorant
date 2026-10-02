"""Facts extracted from matches: the only inputs of the statistical analysis.

Each fact type has one table in the database (see `db/models/facts.py`) and is rebuilt from the raw
Henrik payloads by `ingestion/facts_rebuild.py`.
"""

from dataclasses import dataclass
from datetime import datetime

from valostats.domain.enums import BuyType, Cohort, KillerCohort, Side


@dataclass(frozen=True, slots=True)
class Location:
    """Position in game coordinates (Henrik / valorant-api convention)."""

    x: float
    y: float


@dataclass(frozen=True, slots=True)
class RoundFact:
    """One team in one round."""

    match_id: str
    started_at: datetime
    patch: str
    map_name: str
    round_index: int
    cohort: Cohort
    team_id: str
    side: Side
    won: bool
    # True if this team got the first kill, False if it suffered it, None for a round without kills.
    first_kill: bool | None
    buy: BuyType
    opp_buy: BuyType
    # Best and worst alive-player difference reached during the round (e.g. 5v3 gives +2).
    max_advantage: int
    min_advantage: int
    planted: bool
    plant_site: str | None
    advantage_at_plant: int | None
    # Every "XvY" situation the team went through, X being its own alive players.
    states: tuple[str, ...]
    result: str
    first_kill_ms: int | None
    plant_ms: int | None
    loadout: float
    opp_loadout: float


@dataclass(frozen=True, slots=True)
class DeathFact:
    """One death, seen from the victim's team."""

    match_id: str
    started_at: datetime
    patch: str
    map_name: str
    round_index: int
    cohort: Cohort
    team_id: str
    name: str
    side: Side
    ms: int
    opening: bool
    traded: bool
    # Teammate who took the revenge, if any.
    avenger: str | None
    callout: str
    # Damage the victim dealt in the round before dying.
    damage: int
    post_plant: bool
    killer: str
    killer_cohort: KillerCohort
    teamkill: bool


@dataclass(frozen=True, slots=True)
class PlayerRoundFact:
    """One player in one round."""

    match_id: str
    started_at: datetime
    patch: str
    map_name: str
    round_index: int
    cohort: Cohort
    side: Side
    puuid: str
    name: str
    agent: str
    won: bool
    match_won: bool
    kills: int
    deaths: int
    assists: int
    score: int
    damage: int
    headshots: int
    bodyshots: int
    legshots: int
    survived: bool
    traded: bool
    kast: bool
    revenge_given: int
    first_blood: bool
    first_death: bool
    first_blood_location: Location | None
    first_death_location: Location | None
    # Number of opponents alive when the player was left alone; 0 if no clutch.
    clutch_versus: int
    clutch_won: bool
    # Win probability added by the player's kills, deaths and plant (from -1 to 1).
    win_probability_added: float
    death_ms: int | None
    zero_damage_death: bool
    weapon: str | None
    death_callout: str | None

    @property
    def shots(self) -> int:
        return self.headshots + self.bodyshots + self.legshots


@dataclass(frozen=True, slots=True)
class PlayerMatchFact:
    """One player in one match: what only exists at match level (ability casts)."""

    match_id: str
    started_at: datetime
    patch: str
    map_name: str
    cohort: Cohort
    team_id: str
    puuid: str
    name: str
    agent: str
    rounds: int
    won: bool
    grenade_casts: int
    ability1_casts: int
    ability2_casts: int
    ultimate_casts: int


@dataclass(frozen=True, slots=True)
class WinProbabilityCell:
    """Empirical outcome of every round state with these numbers, side and spike status."""

    own_alive: int
    opp_alive: int
    side: Side
    planted: bool
    wins: int
    total: int
