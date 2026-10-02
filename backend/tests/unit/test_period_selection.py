from dataclasses import dataclass
from datetime import date, datetime
from zoneinfo import ZoneInfo

from valostats.analysis.period.selection import PeriodQuery, resolve

PARIS = ZoneInfo("Europe/Paris")


@dataclass
class Fact:
    started_at: datetime
    patch: str = "13.05"


def at(day: str) -> Fact:
    return Fact(datetime.fromisoformat(day).replace(tzinfo=PARIS))


def test_default_is_the_latest_month_compared_with_the_month_before():
    window = resolve(PeriodQuery(), [at("2026-08-20").started_at, at("2026-09-02").started_at], ["13.05"])
    assert (window.key, window.title, window.comparison_label) == ("2026-09", "Septembre 2026", "vs août")
    assert window.includes(at("2026-09-30T23:00:00")) and not window.includes(at("2026-10-01"))
    assert window.previous(at("2026-08-01"))


def test_january_is_compared_with_december_of_the_previous_year():
    window = resolve(PeriodQuery(month="2027-01"), [], [])
    assert window.previous(at("2026-12-31")) and window.comparison_label == "vs décembre"


def test_patch_is_compared_with_the_previous_patch_played():
    window = resolve(PeriodQuery(patch="13.10"), [], ["13.9", "13.10", "13.5"])
    assert window.comparison_label == "vs patch 13.9"
    assert window.includes(Fact(datetime.now(PARIS), "13.10")) and window.previous(Fact(datetime.now(PARIS), "13.9"))


def test_range_is_compared_with_the_same_number_of_days_before():
    window = resolve(PeriodQuery(start=date(2026, 9, 11), end=date(2026, 9, 20)), [], [])
    assert window.comparison_label == "vs les 10 jours précédents"
    assert window.includes(at("2026-09-20T23:59:00")) and not window.includes(at("2026-09-21"))
    assert window.previous(at("2026-09-01")) and not window.previous(at("2026-08-31"))
