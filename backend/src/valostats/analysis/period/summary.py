"""The "À retenir" box: the main weaknesses and strengths, plus the worst first-death spot."""

from collections import Counter
from collections.abc import Sequence

from valostats.analysis.period.findings import FindingSet
from valostats.constants.labels import SIDE_LABELS
from valostats.domain.enums import Cohort, Tone
from valostats.domain.facts import DeathFact
from valostats.schemas.period.findings import SummaryItem

MAX_WEAK = 3
MAX_STRONG = 2
MIN_SPOT_DEATHS = 4


def summary(findings: FindingSet, deaths: Sequence[DeathFact]) -> list[SummaryItem]:
    weak = [t for t in findings.shown if not t.good][:MAX_WEAK]
    strong = [t for t in findings.shown if t.good][:MAX_STRONG]
    items = [
        SummaryItem(scope=t.scope, label=t.metric.label, tone=Tone.GOOD if t.good else Tone.BAD, squad=t.squad, reference=t.opponents)
        for t in weak + strong
    ]
    spots = Counter((d.map_name, d.side, d.callout) for d in deaths if d.cohort is Cohort.SQUAD and d.opening).most_common(1)
    if spots and spots[0][1] >= MIN_SPOT_DEATHS:
        (map_name, side, callout), n = spots[0]
        items.append(
            SummaryItem(
                scope=f"{map_name} · {SIDE_LABELS[side]}", label=f"{n} first deaths à {callout}", tone=Tone.BAD, squad=None, reference=None
            )
        )
    return items
