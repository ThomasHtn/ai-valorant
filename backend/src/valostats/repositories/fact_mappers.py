"""Conversions between fact dataclasses and database rows (dicts of column values).

Rows differ from facts in three ways: a `Location` is stored as two columns (`<prefix>_x`, `<prefix>_y`),
tuples are stored as arrays, and dates come back in UTC.
"""

from collections.abc import Mapping
from dataclasses import asdict
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

from valostats.constants.game import LOCAL_TIMEZONE
from valostats.domain.enums import BuyType, Cohort, KillerCohort, KillMeans, Side
from valostats.domain.facts import KillFact, Location, MatchFact, PlayerMatchFact, PlayerRoundFact, RoundFact

LOCAL_TZ = ZoneInfo(LOCAL_TIMEZONE)
Row = Mapping[str, Any]


def _local(moment: datetime) -> datetime:
    # The database returns UTC; reports reason in the squad's time zone (evenings, months).
    return moment.astimezone(LOCAL_TZ)


def _flatten(row: dict[str, Any], field: str, prefix: str) -> None:
    """Replace a location field by its `<prefix>_x` and `<prefix>_y` columns (in place)."""
    point = row.pop(field)
    row[f"{prefix}_x"] = point["x"] if point else None
    row[f"{prefix}_y"] = point["y"] if point else None


def _unflatten(values: dict[str, Any], field: str, prefix: str) -> None:
    """Inverse of `_flatten` (in place)."""
    x, y = values.pop(f"{prefix}_x"), values.pop(f"{prefix}_y")
    values[field] = Location(x, y) if x is not None else None


def match_to_row(fact: MatchFact) -> dict[str, Any]:
    row = asdict(fact)
    for field in ("lineup", "agents", "opp_agents"):
        row[field] = list(row[field])
    return row


def match_from_row(row: Row) -> MatchFact:
    return MatchFact(
        **{
            **row,
            "started_at": _local(row["started_at"]),
            "cohort": Cohort(row["cohort"]),
            "start_side": Side(row["start_side"]),
            "lineup": tuple(row["lineup"]),
            "agents": tuple(row["agents"]),
            "opp_agents": tuple(row["opp_agents"]),
        }
    )


def round_to_row(fact: RoundFact) -> dict[str, Any]:
    row = asdict(fact)
    row["states"] = list(fact.states)
    _flatten(row, "plant_location", "plant")
    return row


def round_from_row(row: Row) -> RoundFact:
    values = dict(row)
    _unflatten(values, "plant_location", "plant")
    return RoundFact(
        **{
            **values,
            "started_at": _local(row["started_at"]),
            "cohort": Cohort(row["cohort"]),
            "side": Side(row["side"]),
            "buy": BuyType(row["buy"]),
            "opp_buy": BuyType(row["opp_buy"]),
            "states": tuple(row["states"]),
        }
    )


def kill_to_row(fact: KillFact) -> dict[str, Any]:
    row = asdict(fact)
    # The table is replaced per cohort through `cohort`, which is the victim's cohort.
    row["cohort"] = row.pop("victim_cohort")
    row["assistants"] = list(fact.assistants)
    _flatten(row, "victim_location", "victim")
    _flatten(row, "killer_location", "killer")
    return row


def kill_from_row(row: Row) -> KillFact:
    values = dict(row)
    _unflatten(values, "victim_location", "victim")
    _unflatten(values, "killer_location", "killer")
    values["victim_cohort"] = Cohort(values.pop("cohort"))
    return KillFact(
        **{
            **values,
            "started_at": _local(row["started_at"]),
            "killer_cohort": KillerCohort(row["killer_cohort"]),
            "victim_side": Side(row["victim_side"]),
            "means": KillMeans(row["means"]),
            "assistants": tuple(row["assistants"]),
        }
    )


def player_round_to_row(fact: PlayerRoundFact) -> dict[str, Any]:
    row = asdict(fact)
    _flatten(row, "first_blood_location", "first_blood")
    _flatten(row, "first_death_location", "first_death")
    return row


def player_round_from_row(row: Row) -> PlayerRoundFact:
    values = dict(row)
    _unflatten(values, "first_blood_location", "first_blood")
    _unflatten(values, "first_death_location", "first_death")
    return PlayerRoundFact(
        **{**values, "started_at": _local(row["started_at"]), "cohort": Cohort(row["cohort"]), "side": Side(row["side"])}
    )


def player_match_to_row(fact: PlayerMatchFact) -> dict[str, Any]:
    return asdict(fact)


def player_match_from_row(row: Row) -> PlayerMatchFact:
    return PlayerMatchFact(**{**row, "started_at": _local(row["started_at"]), "cohort": Cohort(row["cohort"])})
