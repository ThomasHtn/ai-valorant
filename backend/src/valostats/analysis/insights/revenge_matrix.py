"""Who avenges whom inside the squad."""

from collections import Counter
from collections.abc import Sequence

from valostats.analysis.team.match_results import squad_only
from valostats.domain.facts import DeathFact
from valostats.schemas.common import Rate
from valostats.schemas.period.insights import RevengeMatrix


def revenge_matrix(deaths: Sequence[DeathFact]) -> RevengeMatrix:
    squad = squad_only(deaths)
    names = [n for n, _ in Counter(d.name for d in squad).most_common()]
    counts, traded = [], []
    for victim in names:
        own = [d for d in squad if d.name == victim]
        by_avenger = Counter(d.avenger for d in own if d.avenger)
        counts.append([0 if avenger == victim else by_avenger.get(avenger, 0) for avenger in names])
        traded.append(Rate(count=sum(by_avenger.values()), total=len(own)))
    return RevengeMatrix(names=names, counts=counts, traded=traded)
