"""Session report: one evening of squad matches, read against the squad's history on each map."""

from datetime import date, datetime
from typing import Literal

from valostats.domain.enums import Side, Tone
from valostats.schemas.common import ApiModel, MinimapPoint, Rate
from valostats.schemas.period.player import HeadlineValue, RosterRow


class SessionListItem(ApiModel):
    day: date
    matches: int
    wins: int
    losses: int
    maps: list[str]


class SessionPoint(ApiModel):
    """A recurring mistake or an unusual result of one match, as French text."""

    side: Side
    tone: Tone
    title: str
    detail: str


class TimelineStep(ApiModel):
    time_ms: int
    kind: Literal["death", "kill", "plant"]
    text: str
    # Alive players after the event, squad first ("3v2").
    state: str
    # The kill that cost the most win probability.
    turning: bool


class SnapshotPlayer(ApiModel):
    name: str
    squad: bool
    position: MinimapPoint


class KillSnapshot(ApiModel):
    """Every player alive right after a kill; the killer is linked to the victim."""

    map_name: str
    minimap_url: str
    victim: MinimapPoint
    victim_squad: bool
    killer: MinimapPoint | None
    players: list[SnapshotPlayer]


class CostlyRound(ApiModel):
    """A round lost after the squad was clearly favoured, with what went wrong."""

    round_number: int
    side: Side
    buy: str
    # Highest chance of winning the squad reached in the round, from 0 to 1.
    best_chance: float
    headline: str
    notes: list[str]
    # Situation at the peak ("4v2, spike planté") and when it happened.
    state: str
    time_ms: int
    steps: list[TimelineStep]
    turning_label: str | None
    snapshot: KillSnapshot | None


class ScoreboardRow(ApiModel):
    name: str
    agent: str
    kills: int
    deaths: int
    assists: int
    acs: float | None
    adr: float | None
    kast: float | None
    first_bloods: int
    first_deaths: int
    impact: float | None


class SessionMatch(ApiModel):
    match_id: str
    map_name: str
    started_at: datetime
    rounds_won: int
    rounds_lost: int
    attack: Rate
    defense: Rate
    scoreboard: list[ScoreboardRow]
    recurring: list[SessionPoint]
    unusual: list[SessionPoint]
    costly_rounds: list[CostlyRound]


class SessionHighlight(ApiModel):
    """A line of the evening summary: a bad point, or one of the costliest throws."""

    map_name: str
    title: str
    side: Side | None
    round_number: int | None
    state: str | None


class VersusUsualRow(ApiModel):
    """The evening against the player's own average on the other matches (`previous`)."""

    name: str
    acs: HeadlineValue
    adr: HeadlineValue
    kast: HeadlineValue
    impact: HeadlineValue


class SessionReport(ApiModel):
    day: date
    # Month of the evening, to link the period report.
    month: str
    matches: list[SessionMatch]
    highlights: list[SessionHighlight]
    roster: list[RosterRow]
    versus_usual: list[VersusUsualRow]
