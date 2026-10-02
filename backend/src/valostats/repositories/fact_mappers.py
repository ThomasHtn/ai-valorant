"""Conversions between fact dataclasses and database rows (dicts of column values)."""

from collections.abc import Mapping
from dataclasses import asdict
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

from valostats.constants.game import LOCAL_TIMEZONE
from valostats.domain.enums import BuyType, Cohort, KillerCohort, Side
from valostats.domain.facts import DeathFact, Location, PlayerMatchFact, PlayerRoundFact, RoundFact

LOCAL_TZ = ZoneInfo(LOCAL_TIMEZONE)
Row = Mapping[str, Any]


def _local(moment: datetime) -> datetime:
    # The database returns UTC; reports reason in the squad's time zone (evenings, months).
    return moment.astimezone(LOCAL_TZ)


def round_to_row(fact: RoundFact) -> dict[str, Any]:
    row = asdict(fact)
    row["states"] = list(fact.states)
    return row


def round_from_row(row: Row) -> RoundFact:
    return RoundFact(
        **{
            **row,
            "started_at": _local(row["started_at"]),
            "cohort": Cohort(row["cohort"]),
            "side": Side(row["side"]),
            "buy": BuyType(row["buy"]),
            "opp_buy": BuyType(row["opp_buy"]),
            "states": tuple(row["states"]),
        }
    )


def death_to_row(fact: DeathFact) -> dict[str, Any]:
    return asdict(fact)


def death_from_row(row: Row) -> DeathFact:
    return DeathFact(
        **{
            **row,
            "started_at": _local(row["started_at"]),
            "cohort": Cohort(row["cohort"]),
            "side": Side(row["side"]),
            "killer_cohort": KillerCohort(row["killer_cohort"]),
        }
    )


def player_round_to_row(fact: PlayerRoundFact) -> dict[str, Any]:
    row = asdict(fact)
    for prefix in ("first_blood", "first_death"):
        location = row.pop(f"{prefix}_location")
        row[f"{prefix}_x"] = location["x"] if location else None
        row[f"{prefix}_y"] = location["y"] if location else None
    return row


def player_round_from_row(row: Row) -> PlayerRoundFact:
    values = dict(row)
    locations = {}
    for prefix in ("first_blood", "first_death"):
        x, y = values.pop(f"{prefix}_x"), values.pop(f"{prefix}_y")
        locations[f"{prefix}_location"] = Location(x, y) if x is not None else None
    return PlayerRoundFact(
        **{**values, **locations, "started_at": _local(row["started_at"]), "cohort": Cohort(row["cohort"]), "side": Side(row["side"])}
    )


def player_match_to_row(fact: PlayerMatchFact) -> dict[str, Any]:
    return asdict(fact)


def player_match_from_row(row: Row) -> PlayerMatchFact:
    return PlayerMatchFact(**{**row, "started_at": _local(row["started_at"]), "cohort": Cohort(row["cohort"])})
