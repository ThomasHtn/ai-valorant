"""Player sheet of the Joueurs view: one squad player of the period, every figure beside its references."""

from datetime import date

from valostats.domain.enums import Side
from valostats.schemas.common import ApiModel, RoundRef
from valostats.schemas.report.tables import StatCell, StatTable, ValueFormat


class PlayerSummary(ApiModel):
    """A squad player of the period, for the player picker."""

    name: str
    puuid: str
    main_agent: str
    # English role (Duelist, Initiator, Controller, Sentinel); the front translates it.
    role: str
    # Latest competitive tier of the period, English name (e.g. "Platinum 1"), None when unranked.
    rank: str | None
    matches: int
    rounds: int


class HeadlineStat(ApiModel):
    """One tile of the headline band: the player's value and his references (top/opp: same role, hist: himself)."""

    key: str
    label: str
    format: ValueFormat
    # 1 higher is better, -1 lower is better.
    better: int
    help: str
    # Sample under which the tile stays grey.
    min: int
    cell: StatCell


class AgentPlayed(ApiModel):
    agent: str
    matches: int


class WeaponUse(ApiModel):
    """One of the weapons the player kills most with."""

    weapon: str
    kills: int
    # Share of the player's kills.
    share: float
    # Headshot rate in the rounds he bought this weapon (Henrik has no weapon per shot).
    headshot_rate: float | None
    shots: int
    # Median kill distance in metres.
    distance: float | None


class ZoneDeath(RoundRef):
    """A death in a zone: the round to rewatch."""

    side: Side
    first_death: bool


class DeathZone(ApiModel):
    """A zone where the player dies often, on one map."""

    map_name: str
    zone: str
    deaths: int
    # Share of all his deaths.
    share: float
    first_deaths: int
    first_death_share: float
    rounds: list[ZoneDeath]


class OpeningDuels(ApiModel):
    first_bloods: int
    first_deaths: int
    # First bloods / (first bloods + first deaths).
    duels_won: StatCell
    won_after_first_blood: StatCell
    won_after_first_death: StatCell


class ClutchLine(ApiModel):
    """Clutches of one size ("1v1", "1v2", "1v3+") played by the player."""

    situation: str
    won: int
    played: int
    cell: StatCell


class FormMatch(ApiModel):
    """One match of the player, oldest first, for the form tiles."""

    match_id: str
    day: date
    map_name: str
    agent: str
    acs: float
    kills: int
    deaths: int
    assists: int
    won: bool
    # Squad score, e.g. "13-9".
    score: str
    in_period: bool


class RewatchRound(RoundRef):
    """A first death without revenge, with what killed the player."""

    zone: str
    weapon: str | None
    side: Side
    killer_agent: str | None
    seconds: float


class PlayerSheet(ApiModel):
    name: str
    puuid: str
    main_agent: str
    role: str
    rank: str | None
    matches: int
    rounds: int
    agents: list[AgentPlayed]
    headline: list[HeadlineStat]
    by_map: StatTable
    by_agent: StatTable
    by_side: StatTable
    weapons: list[WeaponUse]
    death_zones: list[DeathZone]
    opening_duels: OpeningDuels
    clutches: list[ClutchLine]
    form: list[FormMatch]
    rewatch: list[RewatchRound]
