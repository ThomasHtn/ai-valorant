from datetime import UTC, date, datetime

from valostats.analysis.period.findings import ComparisonTest, FindingSet
from valostats.analysis.period.metrics import TRADED_DEATHS, ZERO_DAMAGE_DEATHS
from valostats.analysis.period.summary import summary
from valostats.schemas.common import MatchLink, Rate

LINKS = {
    "a": MatchLink(
        match_id="a",
        session_day=date(2026, 10, 1),
        started_at=datetime(2026, 10, 1, 21, tzinfo=UTC),
        map_name="Split",
        rounds_won=13,
        rounds_lost=7,
    )
}


def comparison(metric, squad: Rate, opponents: Rate, good: bool) -> ComparisonTest:
    return ComparisonTest(
        scope="Split",
        map_name="Split",
        metric=metric,
        squad=squad,
        opponents=opponents,
        good=good,
        p=0.01,
        effect=0.2,
        failures=[],
        top=Rate(count=6, total=10),
        by_match={"a": squad},
    )


def test_a_line_reads_in_its_colour_direction():
    weak = comparison(TRADED_DEATHS, Rate(count=3, total=10), Rate(count=6, total=10), good=False)
    strong = comparison(ZERO_DAMAGE_DEATHS, Rate(count=2, total=10), Rate(count=4, total=10), good=True)
    items = summary(FindingSet(tests=[weak, strong], shown=[weak, strong]), [], LINKS)

    # A red "Morts avec revenge" at 30 % reads as 70 % of deaths without one, against 40 %.
    assert items[0].label == "Morts sans revenge"
    assert items[0].inverted
    assert (items[0].squad.count, items[0].reference.count, items[0].top.count) == (7, 4, 4)
    assert items[0].matches[0].rate.count == 7
    assert (items[0].counted.many, items[0].tries.many) == ("morts sans revenge", "morts")

    # A green "Morts sans dégât infligé" at 20 % reads as 80 % of deaths with damage, against 60 %.
    assert items[1].label == "Morts avec dégâts infligés"
    assert items[1].squad.count == 8


def test_a_line_already_in_its_colour_direction_is_kept():
    weak = comparison(ZERO_DAMAGE_DEATHS, Rate(count=6, total=10), Rate(count=4, total=10), good=False)
    (item,) = summary(FindingSet(tests=[weak], shown=[weak]), [], LINKS)
    assert item.label == "Morts sans dégât infligé"
    assert not item.inverted
    assert item.squad.count == 6
