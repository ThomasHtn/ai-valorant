"""Player sheet of the Joueurs view: one squad player of the period, every figure beside its references."""

from valostats.domain.enums import Side
from valostats.schemas.common import ApiModel, RoundRef
from valostats.schemas.report.tables import StatCell, StatTable, ValueFormat


class PlayerSummary(ApiModel):
    """A squad player of the period, for the player picker."""

    name: str
    puuid: str
    # Avatar agent picked in ValoQuests, else the most played agent.
    portrait: str
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
    # What the sample counts, written under the tile ("rounds", "morts", "duels"...).
    unit: str
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
    # Same figures for top ranked players of his role; None without top ranked kills with it.
    top_share: float | None
    top_headshot_rate: float | None
    top_distance: float | None


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
    # Rounds the player played on that map, and his deaths in the zone per 100 of them.
    rounds_played: int
    per_100_rounds: float | None
    # Same rate for top ranked players of his role on that map; None without top ranked data.
    top_per_100_rounds: float | None
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


class RewatchRound(RoundRef):
    """A first death without revenge, with what killed the player."""

    zone: str
    weapon: str | None
    side: Side
    killer_agent: str | None
    seconds: float


class PlayerSituation(ApiModel):
    """A situation of the player against the top ranked of his role, in its own unit and in rounds.

    `gap` counts duels, deaths or clutches won (+) or lost (-) against a top ranked player of the
    role on the same n; `cost` turns it into rounds with what one of them is worth to the top ranked.
    """

    key: str
    label: str
    detail: str
    # What `n` counts: "duels", "morts", "clutchs".
    unit: str
    # 1 when a higher rate is better, -1 when lower is (deaths without damage).
    better: int
    k: int
    n: int
    top: float | None
    gap: float | None
    cost: float | None


class PlayerSheet(ApiModel):
    name: str
    puuid: str
    # Avatar agent picked in ValoQuests, else the most played agent.
    portrait: str
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
    # Buying habits outside pistols, coloured against top ranked players of his role.
    economy: list[HeadlineStat]
    # Ability casts on each of his agents.
    utility: StatTable
    death_zones: list[DeathZone]
    opening_duels: OpeningDuels
    clutches: list[ClutchLine]
    rewatch: list[RewatchRound]
    # The costliest first, in rounds against the top ranked of his role.
    situations: list[PlayerSituation]
