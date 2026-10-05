"""Stratégie view of one map: what the top ranked play there, and the habits that explain their extra rounds."""

from valostats.schemas.common import ApiModel, Rate
from valostats.schemas.report.minimap import Callout, DensityCell


class CompLine(ApiModel):
    """A composition and the team-matches behind it; `rounds` counts rounds won over rounds played."""

    agents: list[str]
    matches: int
    # Share of the cohort's team-matches on the map.
    share: float
    rounds: Rate


class AgentPick(ApiModel):
    agent: str
    role: str
    # Share of top ranked team-matches on the map where the agent is played.
    share: float
    # Played by the squad on this map in the period.
    squad: bool


class Habit(ApiModel):
    """How often a team does something, and what it changes in rounds won.

    `won_if` and `won_else` are top ranked round win rates with and without the habit; `cost` is the
    rounds per match the squad wins (+) or loses (-) by doing it more or less often than the top ranked.
    """

    key: str
    label: str
    # What the share counts, e.g. "premières morts tradées".
    detail: str
    top: Rate
    squad: Rate
    won_if: float | None
    won_else: float | None
    cost: float | None


class SiteShare(ApiModel):
    """Plants on one site: share of the plants, and post-plant rounds won there."""

    site: str
    top: Rate
    squad: Rate
    top_won: Rate
    squad_won: Rate


class ContactZone(ApiModel):
    """Where the defense meets the first duel: share of opening duels, and defense duels won there."""

    zone: str
    top: Rate
    squad: Rate
    top_won: Rate
    squad_won: Rate


class SquadPlant(ApiModel):
    x: float
    y: float
    site: str | None
    won: bool


class StrategyView(ApiModel):
    map_name: str
    minimap_url: str
    callouts: list[Callout]
    top_matches: int
    patches: list[str]
    squad_matches: Rate
    comps: list[CompLine]
    # The squad's most played composition on the map, None when it did not play the map.
    squad_comp: CompLine | None
    agents: list[AgentPick]
    habits: list[Habit]
    sites: list[SiteShare]
    top_plants: list[DensityCell]
    squad_plants: list[SquadPlant]
    contacts: list[ContactZone]
