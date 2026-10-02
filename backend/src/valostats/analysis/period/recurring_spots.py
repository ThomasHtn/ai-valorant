"""Callouts where the squad keeps dying first, per map and side."""

from collections import Counter
from collections.abc import Sequence

from valostats.analysis.period.rewatch import latest_refs
from valostats.domain.enums import Cohort
from valostats.domain.facts import DeathFact
from valostats.schemas.period.findings import RecurringSpot, SpotPlayer

MAX_SPOTS = 8
MIN_SPOT_DEATHS = 4


def recurring_spots(deaths: Sequence[DeathFact]) -> list[RecurringSpot]:
    openings = [d for d in deaths if d.cohort is Cohort.SQUAD and d.opening and not d.teamkill]
    spots = []
    for (map_name, side, callout), n in Counter((d.map_name, d.side, d.callout) for d in openings).most_common(MAX_SPOTS):
        if n < MIN_SPOT_DEATHS:
            break
        at_spot = [d for d in openings if (d.map_name, d.side, d.callout) == (map_name, side, callout)]
        spots.append(
            RecurringSpot(
                map_name=map_name,
                side=side,
                callout=callout,
                count=n,
                revenges=sum(d.traded for d in at_spot),
                players=[SpotPlayer(name=name, count=c) for name, c in Counter(d.name for d in at_spot).most_common()],
                rewatch=latest_refs(at_spot),
            )
        )
    return spots
