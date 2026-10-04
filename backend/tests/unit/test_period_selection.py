from dataclasses import dataclass
from datetime import date, datetime
from zoneinfo import ZoneInfo

from tests.report_facts import match_fact
from valostats.analysis.report.foundation.period_selection import PeriodQuery, resolve
from valostats.analysis.report.overview.evenings import evenings
from valostats.domain.facts import MatchFact

PARIS = ZoneInfo("Europe/Paris")


@dataclass
class Fact:
    started_at: datetime
    patch: str = "13.05"
    match_id: str = "m"


def at(day: str) -> Fact:
    return Fact(datetime.fromisoformat(day).replace(tzinfo=PARIS))


def test_default_is_the_latest_month_compared_with_the_month_before():
    window = resolve(PeriodQuery(), [at("2026-08-20").started_at, at("2026-09-02").started_at], ["13.05"])
    assert (window.key, window.title) == ("2026-09", "Septembre 2026")
    assert window.includes(at("2026-09-30T23:00:00")) and not window.includes(at("2026-10-01"))
    assert window.previous(at("2026-08-01"))


def test_january_is_compared_with_december_of_the_previous_year():
    window = resolve(PeriodQuery(month="2027-01"), [], [])
    assert window.previous(at("2026-12-31"))


def test_patch_is_compared_with_the_previous_patch_played():
    window = resolve(PeriodQuery(patch="13.10"), [], ["13.9", "13.10", "13.5"])
    assert window.includes(Fact(datetime.now(PARIS), "13.10")) and window.previous(Fact(datetime.now(PARIS), "13.9"))


def test_range_is_compared_with_the_same_number_of_days_before():
    window = resolve(PeriodQuery(start=date(2026, 9, 11), end=date(2026, 9, 20)), [], [])
    assert window.includes(at("2026-09-20T23:59:00")) and not window.includes(at("2026-09-21"))
    assert window.previous(at("2026-09-01")) and not window.previous(at("2026-08-31"))


def test_a_session_after_midnight_stays_on_its_day_and_in_its_month():
    late = Fact(datetime.fromisoformat("2026-10-01T00:40:00").replace(tzinfo=PARIS), match_id="late")
    session_day = {"late": date(2026, 9, 30)}
    session = resolve(PeriodQuery(start=date(2026, 9, 30), end=date(2026, 9, 30)), [], [], session_day)
    assert session.includes(late)
    assert resolve(PeriodQuery(month="2026-09"), [], [], session_day).includes(late)
    assert not resolve(PeriodQuery(month="2026-10"), [], [], session_day).includes(late)


def test_evenings_keep_after_midnight_matches_and_merge_a_day():
    def match(at: str, match_id: str) -> MatchFact:
        return match_fact(match_id=match_id, started_at=datetime.fromisoformat(at).replace(tzinfo=PARIS))

    played = [
        match("2026-09-30T22:30", "a"),
        match("2026-10-01T00:40", "b"),
        match("2026-10-02T15:00", "c"),
        match("2026-10-02T21:00", "d"),
    ]
    assert [[m.match_id for m in e.matches] for e in evenings(played)] == [["a", "b"], ["c", "d"]]
    assert [e.day for e in evenings(played)] == [date(2026, 9, 30), date(2026, 10, 2)]
