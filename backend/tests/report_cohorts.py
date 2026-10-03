"""Build `ReportCohorts` from hand-made facts (see tests/report_facts.py) for the domain tests.

The period is September 2026; facts dated in August (report_facts.AUGUST) land in the squad history.
"""

from collections.abc import Sequence
from typing import Any

from tests.report_facts import AUGUST, match_fact
from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohorts, build_cohorts, build_index
from valostats.analysis.report.foundation.period_selection import PeriodQuery, resolve
from valostats.domain.enums import Cohort


def make_cohorts(
    *,
    matches: Sequence[Any] = (),
    rounds: Sequence[Any] = (),
    kills: Sequence[Any] = (),
    player_rounds: Sequence[Any] = (),
    player_matches: Sequence[Any] = (),
    top_rounds: Sequence[Any] = (),
    top_kills: Sequence[Any] = (),
    top_player_rounds: Sequence[Any] = (),
    top_player_matches: Sequence[Any] = (),
) -> ReportCohorts:
    """Squad matches' facts (squad and opponents) and top ranked facts, split for the September report."""
    all_matches = list(matches) or [match_fact(), match_fact(match_id="old", started_at=AUGUST)]
    window = resolve(PeriodQuery(month="2026-09"), [m.started_at for m in all_matches], [m.patch for m in all_matches])
    squad_facts = {
        FactKind.MATCHES: all_matches,
        FactKind.ROUNDS: list(rounds),
        FactKind.KILLS: list(kills),
        FactKind.PLAYER_ROUNDS: list(player_rounds),
        FactKind.PLAYER_MATCHES: list(player_matches),
    }
    top = build_index([], top_rounds, top_kills, top_player_rounds, top_player_matches, Cohort.TOP)
    return build_cohorts(window, squad_facts, top)
