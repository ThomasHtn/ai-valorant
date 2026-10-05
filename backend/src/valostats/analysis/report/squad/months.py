"""Month-by-month figures of the Escouade view: the squad's period and its history, month by month.

The months end with the last month of the period and go back `MONTHS_SHOWN` calendar months, empty
months included, so a gap in play shows as a gap on the chart.
"""

from collections import defaultdict
from collections.abc import Callable, Sequence
from typing import Any

from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohort, ReportCohorts
from valostats.analysis.report.foundation.period_selection import LOCAL_TZ, Dated
from valostats.constants.labels import MONTHS
from valostats.constants.report import MONTHS_SHOWN
from valostats.domain.enums import BuyType, Side
from valostats.domain.facts import RoundFact
from valostats.schemas.common import Rate
from valostats.schemas.report.squad import KpisBefore, MonthPoint

RoundTest = Callable[[RoundFact], bool]


def month_of(fact: Dated) -> str:
    """Local calendar month of a fact: '2026-09'."""
    return f"{fact.started_at.astimezone(LOCAL_TZ):%Y-%m}"


def shown_months(cohorts: ReportCohorts) -> list[str]:
    """The `MONTHS_SHOWN` months ending with the period's last month, oldest first."""
    period = cohorts.squad(FactKind.MATCHES)
    if not period:
        return []
    last = max(month_of(m) for m in period)
    year, number = int(last[:4]), int(last[5:7])
    months: list[str] = []
    for back in range(MONTHS_SHOWN - 1, -1, -1):
        index = year * 12 + number - 1 - back
        months.append(f"{index // 12}-{index % 12 + 1:02d}")
    return months


def by_month(cohorts: ReportCohorts, kind: FactKind, months: Sequence[str]) -> dict[str, list[Any]]:
    """Squad facts of the period and of its history, grouped by the shown months."""
    wanted = set(months)
    grouped: dict[str, list[Any]] = defaultdict(list)
    for cohort in (ReportCohort.HISTORY, ReportCohort.SQUAD):
        for fact in cohorts.select(kind, cohort):
            if (month := month_of(fact)) in wanted:
                grouped[month].append(fact)
    return grouped


def month_points(cohorts: ReportCohorts, months: Sequence[str]) -> list[MonthPoint]:
    matches = by_month(cohorts, FactKind.MATCHES, months)
    rounds = by_month(cohorts, FactKind.ROUNDS, months)
    return [
        MonthPoint(
            month=month,
            label=MONTHS[int(month[5:7]) - 1].capitalize(),
            matches=len(matches[month]),
            rounds=_rate(rounds[month], _won, _every),
            first_duels=_rate(rounds[month], _first_kill, _duel),
            pistols=_rate(rounds[month], _won, _pistol),
            duel_defense=_rate(rounds[month], _first_kill, lambda r: _duel(r) and r.side is Side.DEFENSE),
        )
        for month in months
    ]


def kpis_before(cohorts: ReportCohorts) -> KpisBefore:
    """Headline rates over the squad's history (every match before the period)."""
    matches = cohorts.select(FactKind.MATCHES, ReportCohort.HISTORY)
    rounds = cohorts.select(FactKind.ROUNDS, ReportCohort.HISTORY)
    return KpisBefore(
        wins=Rate(count=sum(m.won for m in matches), total=len(matches)),
        rounds=_rate(rounds, _won, _every),
        first_duels=_rate(rounds, _first_kill, _duel),
        pistols=_rate(rounds, _won, _pistol),
    )


def _rate(rounds: Sequence[RoundFact], success: RoundTest, among: RoundTest) -> Rate:
    base = [r for r in rounds if among(r)]
    return Rate(count=sum(1 for r in base if success(r)), total=len(base))


def _every(_: RoundFact) -> bool:
    return True


def _won(r: RoundFact) -> bool:
    return r.won


def _first_kill(r: RoundFact) -> bool:
    return r.first_kill is True


def _duel(r: RoundFact) -> bool:
    return r.first_kill is not None


def _pistol(r: RoundFact) -> bool:
    return r.buy is BuyType.PISTOL
