"""Key squad metrics of the period against the previous comparable period."""

from collections.abc import Sequence
from typing import Any

from valostats.analysis.period.metrics import DEATH_METRICS, ROUND_METRICS, Metric
from valostats.analysis.statistics.proportions import benjamini_hochberg, two_proportions
from valostats.constants.analysis import MIN_COMPARISON_SAMPLE
from valostats.domain.enums import Cohort, Side
from valostats.domain.facts import DeathFact, RoundFact
from valostats.schemas.common import Rate
from valostats.schemas.period.findings import Evolution, EvolutionLine

SCOPES = ((None, "Toutes cartes"), (Side.ATTACK, "En attaque"), (Side.DEFENSE, "En défense"))


def evolution(
    comparison_label: str,
    rounds: Sequence[RoundFact],
    deaths: Sequence[DeathFact],
    previous_rounds: Sequence[RoundFact],
    previous_deaths: Sequence[DeathFact],
) -> Evolution:
    if not previous_rounds:
        return Evolution(comparison_label=comparison_label, has_previous=False, lines=[])
    candidates: list[tuple[EvolutionLine, float]] = []
    metrics: list[tuple[Metric[Any], Sequence[Any], Sequence[Any]]] = [(m, rounds, previous_rounds) for m in ROUND_METRICS] + [
        (m, deaths, previous_deaths) for m in DEATH_METRICS
    ]
    for side, scope in SCOPES:
        for metric, now, before in metrics:
            if metric.side and metric.side != side:
                continue
            current = _squad_rate(now, metric, side)
            previous = _squad_rate(before, metric, side)
            if current.total < MIN_COMPARISON_SAMPLE or previous.total < MIN_COMPARISON_SAMPLE:
                continue
            assert current.value is not None and previous.value is not None
            line = EvolutionLine(
                scope=scope,
                label=metric.label,
                current=current,
                previous=previous,
                better=(current.value > previous.value) == metric.higher_is_better,
                significant=False,
            )
            candidates.append((line, two_proportions(current.count, current.total, previous.count, previous.total)))
    significant = {id(line) for line, _ in benjamini_hochberg(candidates, lambda c: c[1])}
    lines = [line.model_copy(update={"significant": id(line) in significant}) for line, _ in candidates]
    return Evolution(comparison_label=comparison_label, has_previous=True, lines=lines)


def _squad_rate(rows: Sequence[Any], metric: Metric[Any], side: Side | None) -> Rate:
    selected = [x for x in rows if x.cohort is Cohort.SQUAD and (side is None or x.side == side) and metric.applies(x)]
    return Rate(count=sum(bool(metric.success(x)) for x in selected), total=len(selected))
