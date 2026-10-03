"""Hand-made facts for the report tests: a default fact of each type, changed with keyword arguments.

round_fact(won=False, side=Side.DEFENSE)  # a lost defense round of match m1, squad, September 2026
"""

from dataclasses import replace
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

from valostats.domain.enums import BuyType, Cohort, KillerCohort, KillMeans, Side
from valostats.domain.facts import KillFact, Location, MatchFact, PlayerMatchFact, PlayerRoundFact, RoundFact

PARIS = ZoneInfo("Europe/Paris")
SEPTEMBER = datetime(2026, 9, 10, 21, 0, tzinfo=PARIS)
AUGUST = datetime(2026, 8, 10, 21, 0, tzinfo=PARIS)

_COMMON: dict[str, Any] = {"match_id": "m1", "started_at": SEPTEMBER, "patch": "13.06", "map_name": "Ascent"}

_MATCH = MatchFact(
    **_COMMON,
    cohort=Cohort.SQUAD,
    team_id="Red",
    won=True,
    rounds_won=13,
    rounds_lost=9,
    start_side=Side.ATTACK,
    lineup=("Alpha", "Bravo", "Charlie", "Delta", "Echo"),
    agents=("Jett", "Omen", "Sage", "Sova", "Viper"),
    opp_agents=("Breach", "Killjoy", "Phoenix", "Reyna", "Skye"),
    tier=15.0,
    opp_tier=15.2,
    length_ms=1_800_000,
    cluster="Paris",
)

_ROUND = RoundFact(
    **_COMMON,
    round_index=3,
    cohort=Cohort.SQUAD,
    team_id="Red",
    side=Side.ATTACK,
    won=True,
    first_kill=True,
    first_death_avenged=None,
    buy=BuyType.FULL,
    opp_buy=BuyType.FULL,
    max_advantage=1,
    min_advantage=0,
    planted=False,
    plant_site=None,
    advantage_at_plant=None,
    plant_location=None,
    planter=None,
    defused=False,
    defuser=None,
    states=("5v4",),
    result="Elimination",
    ceremony="CeremonyDefault",
    timeout=False,
    first_kill_ms=15_000,
    plant_ms=None,
    last_event_ms=40_000,
    loadout=4200.0,
    opp_loadout=4200.0,
    alive_end=3,
    opp_alive_end=0,
    score_diff=0,
    previous_won=True,
    previous_losses=0,
    pistol_won=None,
    second_round_won=None,
    match_won=True,
)

_KILL = KillFact(
    **_COMMON,
    round_index=3,
    ms=15_000,
    killer="Alpha",
    killer_puuid="alpha",
    killer_team="Red",
    killer_cohort=KillerCohort.SQUAD,
    victim="Zulu",
    victim_puuid="zulu",
    victim_team="Blue",
    victim_cohort=Cohort.OPPONENT,
    victim_side=Side.DEFENSE,
    weapon="Vandal",
    means=KillMeans.WEAPON,
    secondary_fire=False,
    assistants=(),
    victim_location=Location(0, 0),
    killer_location=Location(1500, 0),
    victim_zone="A Site",
    killer_zone="A Main",
    distance=1500.0,
    nearest_teammate=800.0,
    team_spread=1200.0,
    opening=True,
    avenged=False,
    avenger=None,
    avenge_ms=None,
    victim_team_alive=5,
    killer_team_alive=5,
    post_plant=False,
    victim_damage=0,
    teamkill=False,
)

_PLAYER_ROUND = PlayerRoundFact(
    **_COMMON,
    round_index=3,
    cohort=Cohort.SQUAD,
    side=Side.ATTACK,
    puuid="alpha",
    name="Alpha",
    agent="Jett",
    won=True,
    match_won=True,
    kills=1,
    deaths=0,
    assists=0,
    score=200,
    damage=150,
    damage_received=0,
    headshots=1,
    bodyshots=2,
    legshots=0,
    headshots_received=0,
    bodyshots_received=0,
    legshots_received=0,
    survived=True,
    traded=False,
    kast=True,
    revenge_given=0,
    first_blood=True,
    first_death=False,
    first_blood_location=None,
    first_death_location=None,
    clutch_versus=0,
    clutch_won=False,
    win_probability_added=0.1,
    death_ms=None,
    zero_damage_death=False,
    kills_outnumbered=0,
    multikill_span_ms=None,
    weapon="Vandal",
    armor="Heavy Armor",
    loadout=3900,
    remaining=200,
    death_callout=None,
    afk=False,
    penalty=False,
)

_PLAYER_MATCH = PlayerMatchFact(
    **_COMMON,
    cohort=Cohort.SQUAD,
    team_id="Red",
    puuid="alpha",
    name="Alpha",
    agent="Jett",
    rounds=22,
    won=True,
    score=5000,
    tier_id=15,
    tier_name="Platinum 1",
    grenade_casts=10,
    ability1_casts=20,
    ability2_casts=15,
    ultimate_casts=3,
)


def match_fact(**changes: Any) -> MatchFact:
    return replace(_MATCH, **changes)


def round_fact(**changes: Any) -> RoundFact:
    return replace(_ROUND, **changes)


def kill_fact(**changes: Any) -> KillFact:
    return replace(_KILL, **changes)


def player_round(**changes: Any) -> PlayerRoundFact:
    return replace(_PLAYER_ROUND, **changes)


def player_match(**changes: Any) -> PlayerMatchFact:
    return replace(_PLAYER_MATCH, **changes)
