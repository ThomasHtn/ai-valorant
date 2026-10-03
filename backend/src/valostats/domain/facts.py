"""Facts extracted from matches: the only inputs of the statistical analysis.

Each fact type has one table in the database (see `db/models/`) and is rebuilt from the raw Henrik
payloads by `ingestion/facts_rebuild.py`. Facts are flat and immutable so they can be filtered and
counted quickly in memory, and exported as is to train models later.

Conventions shared by every fact:
- `cohort`: squad (the squad), opp (its opponents in the same matches), top (a top ranked team).
- `round_index` starts at 0; the API shows `round_index + 1`.
- times inside a round (`*_ms`) are milliseconds since the start of the round.
- positions are game coordinates; `domain.maps.GameMap` turns them into minimap points and callouts.
"""

from dataclasses import dataclass
from datetime import datetime

from valostats.domain.enums import BuyType, Cohort, KillerCohort, KillMeans, Side


@dataclass(frozen=True, slots=True)
class Location:
    """Position in game coordinates (Henrik / valorant-api convention)."""

    x: float
    y: float


@dataclass(frozen=True, slots=True)
class MatchFact:
    """One team in one match: score, lineup, context."""

    match_id: str
    started_at: datetime
    patch: str
    map_name: str
    cohort: Cohort
    team_id: str
    won: bool
    rounds_won: int
    rounds_lost: int
    # Side of the first half.
    start_side: Side
    # Player names and agents of the team, alphabetical; opponents' agents for the matchups.
    lineup: tuple[str, ...]
    agents: tuple[str, ...]
    opp_agents: tuple[str, ...]
    # Average competitive tier id of each team (3 = Iron 1 ... 27 = Radiant), None when unranked.
    tier: float | None
    opp_tier: float | None
    length_ms: int | None
    # Game server, e.g. "Frankfurt".
    cluster: str | None

    @property
    def rounds(self) -> int:
        return self.rounds_won + self.rounds_lost


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
    # When the team suffered the first kill: whether it was avenged within the revenge window.
    first_death_avenged: bool | None
    buy: BuyType
    opp_buy: BuyType
    # Best and worst alive-player difference reached during the round (e.g. 5v3 gives +2).
    max_advantage: int
    min_advantage: int
    planted: bool
    plant_site: str | None
    advantage_at_plant: int | None
    plant_location: Location | None
    planter: str | None
    defused: bool
    defuser: str | None
    # Every "XvY" situation the team went through, X being its own alive players.
    states: tuple[str, ...]
    # Henrik result: Elimination, Detonate, Defuse, Surrendered or "" (time ran out).
    result: str
    # Round ceremony: CeremonyDefault, CeremonyFlawless, CeremonyClutch, CeremonyAce, CeremonyThrifty...
    ceremony: str | None
    # Attack lost without a plant while attackers were still alive.
    timeout: bool
    first_kill_ms: int | None
    plant_ms: int | None
    # Time of the last kill, plant or defuse of the round.
    last_event_ms: int
    loadout: float
    opp_loadout: float
    # Alive players of each team at the end of the round.
    alive_end: int
    opp_alive_end: int
    # Context: score difference before the round, result of the previous round and of the pistol.
    score_diff: int
    previous_won: bool | None
    # Rounds lost in a row just before this one.
    previous_losses: int
    # In rounds 2 and 3 of each half: whether the team won the pistol, and (round 3) the round 2.
    pistol_won: bool | None
    second_round_won: bool | None
    match_won: bool

    @property
    def flawless(self) -> bool:
        """Won without losing a player."""
        return self.won and self.alive_end == 5


@dataclass(frozen=True, slots=True)
class KillFact:
    """One kill, with both players, the weapon, the positions and the situation around it."""

    match_id: str
    started_at: datetime
    patch: str
    map_name: str
    round_index: int
    ms: int
    killer: str
    killer_puuid: str
    killer_team: str
    # Environment kills (spike, fall) have an "env" killer cohort.
    killer_cohort: KillerCohort
    victim: str
    victim_puuid: str
    victim_team: str
    victim_cohort: Cohort
    victim_side: Side
    # Henrik weapon name (None for Chamber and Neon ultimates, which Henrik leaves unnamed).
    weapon: str | None
    means: KillMeans
    secondary_fire: bool
    assistants: tuple[str, ...]
    victim_location: Location
    # Missing when the killer is absent from the kill snapshot (rare, e.g. disconnect).
    killer_location: Location | None
    victim_zone: str
    killer_zone: str | None
    # Distance killer-victim and victim-closest living teammate, in game units (100 units = 1 m).
    distance: float | None
    nearest_teammate: float | None
    # Mean distance between the victim's living teammates at the kill (team spacing).
    team_spread: float | None
    opening: bool
    avenged: bool
    avenger: str | None
    avenge_ms: int | None
    # Alive players right before the kill, seen from the victim's team.
    victim_team_alive: int
    killer_team_alive: int
    post_plant: bool
    # Damage the victim dealt in the round before dying.
    victim_damage: int
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
    damage_received: int
    headshots: int
    bodyshots: int
    legshots: int
    # Hits taken, from the opponents' damage events.
    headshots_received: int
    bodyshots_received: int
    legshots_received: int
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
    # Kills made while the player's team had fewer players alive.
    kills_outnumbered: int
    # Time between the first and the last kill of the round (2 kills or more).
    multikill_span_ms: int | None
    # Economy at the end of the buy phase.
    weapon: str | None
    armor: str | None
    loadout: int
    remaining: int
    death_callout: str | None
    afk: bool
    penalty: bool

    @property
    def shots(self) -> int:
        return self.headshots + self.bodyshots + self.legshots

    @property
    def shots_received(self) -> int:
        return self.headshots_received + self.bodyshots_received + self.legshots_received


@dataclass(frozen=True, slots=True)
class PlayerMatchFact:
    """One player in one match: what only exists at match level (ability casts, rank)."""

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
    score: int
    # Competitive tier at the time of the match (id and English name, e.g. 15 "Platinum 1").
    tier_id: int | None
    tier_name: str | None
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


@dataclass(frozen=True, slots=True)
class SourceFacts:
    """Every fact of one match source (squad or top), as extracted and stored together."""

    matches: list[MatchFact]
    rounds: list[RoundFact]
    kills: list[KillFact]
    player_rounds: list[PlayerRoundFact]
    player_matches: list[PlayerMatchFact]
    win_probability: list[WinProbabilityCell]
