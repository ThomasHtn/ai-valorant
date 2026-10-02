from datetime import UTC, date, datetime
from types import SimpleNamespace

from valostats.analysis.period.findings import finding_matches, rates_by_match
from valostats.schemas.common import MatchLink, Rate


def link(match_id: str, hour: int) -> MatchLink:
    started = datetime(2026, 10, 1, hour, tzinfo=UTC)
    return MatchLink(match_id=match_id, session_day=date(2026, 10, 1), started_at=started, map_name="Split", rounds_won=13, rounds_lost=7)


def test_a_figure_is_split_by_match_and_kept_in_match_order():
    rows = [SimpleNamespace(match_id="b", won=True), SimpleNamespace(match_id="a", won=False), SimpleNamespace(match_id="b", won=False)]
    by_match = rates_by_match(rows, lambda r: r.won)
    assert by_match == {"b": Rate(count=1, total=2), "a": Rate(count=0, total=1)}

    # `links` is oldest first; a match the figure does not use is left out.
    links = {"a": link("a", 19), "b": link("b", 20), "c": link("c", 21)}
    matches = finding_matches(by_match, links)
    assert [(m.match_id, m.rate.count, m.rate.total) for m in matches] == [("a", 0, 1), ("b", 1, 2)]
    assert matches[0].session_day == date(2026, 10, 1)
