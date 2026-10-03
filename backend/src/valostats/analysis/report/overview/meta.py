"""The home tree (months, evenings, patches) and the header of a period report."""

from collections import Counter, defaultdict
from collections.abc import Sequence

from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohort, ReportCohorts
from valostats.analysis.report.foundation.period_selection import PeriodQuery, patch_sort_key
from valostats.analysis.report.overview.evenings import Evening, evenings
from valostats.domain.enums import Cohort
from valostats.domain.facts import MatchFact
from valostats.schemas.report.meta import (
    DataQuality,
    EveningSummary,
    MonthSummary,
    PatchCount,
    PeriodKind,
    ReportMeta,
    ReportPeriods,
    ReportPlayer,
)


def report_periods(squad_matches: Sequence[MatchFact], top_matches: Sequence[MatchFact], top_match_count: int) -> ReportPeriods:
    """Home tree, newest first. `squad_matches` may hold both teams: only the squad's are kept."""
    own = [m for m in squad_matches if m.cohort is Cohort.SQUAD]
    by_month: defaultdict[str, list[Evening]] = defaultdict(list)
    for evening in reversed(evenings(own)):
        by_month[f"{evening.day:%Y-%m}"].append(evening)
    starts = [m.started_at for m in (*own, *top_matches)]
    days = sorted(m.started_at.date() for m in own)
    return ReportPeriods(
        freshness=max(starts) if starts else None,
        first_day=days[0] if days else None,
        last_day=days[-1] if days else None,
        top_matches=top_match_count,
        patches=sorted({m.patch for m in own}, key=patch_sort_key, reverse=True),
        months=[_month(key, group) for key, group in sorted(by_month.items(), reverse=True)],
    )


def _month(key: str, group: list[Evening]) -> MonthSummary:
    return MonthSummary(
        key=key,
        matches=sum(len(e.matches) for e in group),
        wins=sum(e.wins for e in group),
        losses=sum(e.losses for e in group),
        sessions=[_evening(e) for e in group],
    )


def _evening(evening: Evening) -> EveningSummary:
    return EveningSummary(
        day=evening.day,
        matches=len(evening.matches),
        wins=evening.wins,
        losses=evening.losses,
        maps=[m.map_name for m in evening.matches],
        scores=[f"{m.rounds_won}-{m.rounds_lost}" for m in evening.matches],
    )


def period_kind(query: PeriodQuery) -> PeriodKind:
    if query.patch:
        return PeriodKind.PATCH
    if query.start and query.end:
        return PeriodKind.SESSION if query.start == query.end else PeriodKind.RANGE
    return PeriodKind.MONTH


def report_meta(query: PeriodQuery, cohorts: ReportCohorts, top_match_count: int) -> ReportMeta:
    """Record, players and data quality of the period."""
    matches = cohorts.matches()
    rounds = cohorts.squad(FactKind.ROUNDS)
    rounds_per_match = Counter(r.match_id for r in rounds)
    complete = sum(1 for m in matches if rounds_per_match[m.match_id] == m.rounds)
    top_matches = cohorts.select(FactKind.MATCHES, ReportCohort.TOP)
    top_maps = {m.map_name for m in top_matches}
    return ReportMeta(
        key=cohorts.window.key,
        title=cohorts.window.title,
        kind=period_kind(query),
        matches=len(matches),
        wins=sum(m.won for m in matches),
        losses=sum(not m.won for m in matches),
        rounds=len(rounds),
        sessions=len(evenings(matches)),
        patches=[
            PatchCount(patch=p, matches=n) for p, n in sorted(Counter(m.patch for m in matches).items(), key=lambda x: patch_sort_key(x[0]))
        ],
        maps=cohorts.maps(),
        players=[ReportPlayer(name=p.name, puuid=p.puuid, portrait=p.portrait, role=p.role) for p in cohorts.players()],
        quality=DataQuality(
            complete_matches=complete,
            incomplete_matches=len(matches) - complete,
            lineups=len({m.lineup for m in matches}),
            top_matches=top_match_count,
            top_patches=sorted({m.patch for m in top_matches}, key=patch_sort_key),
            maps_without_top=[m for m in cohorts.maps() if m not in top_maps],
        ),
    )
