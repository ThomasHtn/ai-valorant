"""The "À retenir" box: the main weaknesses and strengths, plus the worst first-death spot."""

from collections import Counter
from collections.abc import Sequence

from valostats.analysis.period.findings import ComparisonTest, FindingSet, finding_matches
from valostats.analysis.period.reading import read_in_colour
from valostats.constants.labels import SIDE_LABELS
from valostats.domain.enums import Cohort, Tone
from valostats.domain.facts import DeathFact
from valostats.schemas.common import MatchLink, Rate
from valostats.schemas.period.findings import Noun, SummaryItem

MAX_WEAK = 3
MAX_STRONG = 2
MIN_SPOT_DEATHS = 4


def summary(findings: FindingSet, deaths: Sequence[DeathFact], links: dict[str, MatchLink]) -> list[SummaryItem]:
    weak = [t for t in findings.shown if not t.good][:MAX_WEAK]
    strong = [t for t in findings.shown if t.good][:MAX_STRONG]
    items = [_finding_item(t, links) for t in weak + strong]
    first_deaths = [d for d in deaths if d.cohort is Cohort.SQUAD and d.opening]
    spots = Counter((d.map_name, d.side, d.callout) for d in first_deaths).most_common(1)
    if spots and spots[0][1] >= MIN_SPOT_DEATHS:
        (map_name, side, callout), n = spots[0]
        at_spot = Counter(d.match_id for d in first_deaths if (d.map_name, d.side, d.callout) == (map_name, side, callout))
        per_match = Counter(d.match_id for d in first_deaths)
        items.append(
            SummaryItem(
                scope=f"{map_name} · {SIDE_LABELS[side]}",
                metric=None,
                label=f"{n} first deaths à {callout}",
                tone=Tone.BAD,
                inverted=False,
                unit="first deaths",
                counted=Noun(one=f"first death à {callout}", many=f"first deaths à {callout}"),
                tries=Noun(one="dans le match", many="dans le match"),
                squad=None,
                reference=None,
                top=None,
                # In each match: first deaths at the spot over all of the squad's first deaths.
                matches=finding_matches({m: Rate(count=k, total=per_match[m]) for m, k in at_spot.items()}, links),
            )
        )
    return items


def _finding_item(test: ComparisonTest, links: dict[str, MatchLink]) -> SummaryItem:
    """A finding as a line, read in its colour's direction."""
    reading = read_in_colour(test)
    return SummaryItem(
        scope=test.scope,
        metric=test.metric.key,
        label=reading.label,
        tone=Tone.GOOD if test.good else Tone.BAD,
        inverted=reading.inverted,
        unit=test.metric.unit,
        counted=reading.counted,
        tries=reading.tries,
        squad=reading.squad,
        reference=reading.reference,
        top=reading.top,
        matches=finding_matches(reading.by_match, links),
    )
