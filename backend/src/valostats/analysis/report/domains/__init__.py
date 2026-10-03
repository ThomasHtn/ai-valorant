"""Domains of the Tableaux view, one module per domain of the metrics dictionary.

Adding a domain: write `domains/<key>.py` with a `tables(cohorts) -> list[StatTable]` function,
import it below and pass it as `build` in its `Domain` line.
"""

from collections.abc import Callable
from dataclasses import dataclass

from valostats.analysis.report.domains import (
    agents,
    behavior,
    combat,
    context,
    economy,
    opening,
    positions,
    results,
    revenge,
    situations,
    spike,
    timings,
    utility,
    weapons,
)
from valostats.analysis.report.foundation.cohorts import ReportCohorts
from valostats.core.errors import NotFoundError
from valostats.schemas.report.tables import DomainTables, StatTable

DomainBuilder = Callable[[ReportCohorts], list[StatTable]]


@dataclass(frozen=True)
class Domain:
    key: str
    label: str
    build: DomainBuilder


# In the order of the Tableaux side menu.
DOMAINS: dict[str, Domain] = {
    d.key: d
    for d in (
        Domain("results", "Résultats", results.tables),
        Domain("opening", "Ouvertures", opening.tables),
        Domain("combat", "Combat", combat.tables),
        Domain("revenge", "Revenge et espacement", revenge.tables),
        Domain("situations", "Situations", situations.tables),
        Domain("spike", "Spike", spike.tables),
        Domain("economy", "Économie", economy.tables),
        Domain("weapons", "Armes", weapons.tables),
        Domain("utility", "Utilitaire", utility.tables),
        Domain("timings", "Timings", timings.tables),
        Domain("positions", "Positions", positions.tables),
        Domain("agents", "Agents et compos", agents.tables),
        Domain("context", "Contexte", context.tables),
        Domain("behavior", "Comportement", behavior.tables),
    )
}


def build_domain(key: str, cohorts: ReportCohorts) -> DomainTables:
    """Every table of a domain; NotFoundError for an unknown domain."""
    domain = DOMAINS.get(key)
    if domain is None:
        raise NotFoundError(f"Unknown domain {key}.")
    return DomainTables(key=domain.key, label=domain.label, tables=domain.build(cohorts))
