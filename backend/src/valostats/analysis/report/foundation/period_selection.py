"""Which matches a period report covers, and which earlier matches it is compared with."""

from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Protocol
from zoneinfo import ZoneInfo

from valostats.constants.game import LOCAL_TIMEZONE
from valostats.constants.labels import MONTHS
from valostats.domain.patches import patch_sort_key

LOCAL_TZ = ZoneInfo(LOCAL_TIMEZONE)


class Dated(Protocol):
    """Any fact: every fact type carries its match start and patch."""

    @property
    def match_id(self) -> str: ...

    @property
    def started_at(self) -> datetime: ...

    @property
    def patch(self) -> str: ...


FactFilter = Callable[[Dated], bool]


@dataclass(frozen=True)
class PeriodQuery:
    """Exactly one of: a month, a patch, or a date range. Nothing means the latest month."""

    month: str | None = None
    patch: str | None = None
    start: date | None = None
    end: date | None = None

    @property
    def key(self) -> str:
        """Stable identifier, also used as cache key: '2026-09', 'patch-13.05' or '2026-07-01_2026-09-30'."""
        if self.patch:
            return f"patch-{self.patch}"
        if self.start and self.end:
            return f"{self.start}_{self.end}"
        return self.month or "latest"


@dataclass(frozen=True)
class PeriodWindow:
    key: str
    title: str
    includes: FactFilter
    previous: FactFilter


def resolve(
    query: PeriodQuery,
    squad_dates: Sequence[datetime],
    squad_patches: Sequence[str],
    session_day: Mapping[str, date] | None = None,
) -> PeriodWindow:
    """Turn a query into filters; `session_day` (match id -> its session's day) keeps a session after midnight whole."""
    days = session_day or {}

    def day_of(fact: Dated) -> date:
        return days.get(fact.match_id, fact.started_at.date())

    if query.patch:
        return _patch_window(query.patch, squad_patches)
    if query.start and query.end:
        return _range_window(query.start, query.end, day_of)
    month = query.month or f"{max(days.values(), default=None) or max(squad_dates):%Y-%m}"
    return _month_window(month, day_of)


def _patch_window(patch: str, squad_patches: Sequence[str]) -> PeriodWindow:
    patches = sorted(set(squad_patches), key=patch_sort_key)
    index = patches.index(patch) if patch in patches else -1
    previous = patches[index - 1] if index > 0 else None
    return PeriodWindow(
        key=f"patch-{patch}",
        title=f"Patch {patch}",
        includes=lambda f: f.patch == patch,
        previous=lambda f: f.patch == previous,
    )


def _range_window(first_day: date, last_day: date, day_of: Callable[[Dated], date]) -> PeriodWindow:
    start = datetime.combine(first_day, datetime.min.time(), LOCAL_TZ)
    end = datetime.combine(last_day, datetime.min.time(), LOCAL_TZ) + timedelta(days=1)
    length = end - start
    return PeriodWindow(
        key=f"{first_day}_{last_day}",
        title=f"Du {first_day:%d/%m/%Y} au {last_day:%d/%m/%Y}",
        includes=lambda f: first_day <= day_of(f) <= last_day,
        previous=lambda f: start - length <= f.started_at < start,
    )


def _month_window(month: str, day_of: Callable[[Dated], date]) -> PeriodWindow:
    year, number = int(month[:4]), int(month[5:7])
    previous = f"{year - (number == 1)}-{12 if number == 1 else number - 1:02d}"
    return PeriodWindow(
        key=month,
        title=f"{MONTHS[number - 1].capitalize()} {year}",
        includes=lambda f: f"{day_of(f):%Y-%m}" == month,
        previous=lambda f: f"{f.started_at:%Y-%m}" == previous,
    )
