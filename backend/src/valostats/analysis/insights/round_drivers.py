"""Round win rate by situation: first death traded or not, equipment gap, momentum, score, half."""

from collections import defaultdict
from collections.abc import Callable, Sequence
from dataclasses import dataclass

from valostats.analysis.statistics.rates import rate
from valostats.analysis.team.match_results import squad_only
from valostats.domain.enums import BuyType
from valostats.domain.facts import DeathFact, RoundFact
from valostats.schemas.period.insights import DriverGroup, DriverRow


@dataclass(frozen=True)
class RoundInContext:
    """A round with the match situation at its start."""

    fact: RoundFact
    # Rounds won minus rounds lost before this one.
    lead: int
    previous_won: bool | None
    loss_streak: int


def with_context(rounds: Sequence[RoundFact]) -> list[RoundInContext]:
    by_team: dict[tuple[str, str], list[RoundFact]] = defaultdict(list)
    for r in rounds:
        by_team[(r.match_id, r.team_id)].append(r)
    out = []
    for team_rounds in by_team.values():
        team_rounds.sort(key=lambda r: r.round_index)
        lead, streak = 0, 0
        for i, r in enumerate(team_rounds):
            out.append(RoundInContext(r, lead, None if i == 0 else team_rounds[i - 1].won, streak))
            lead += 1 if r.won else -1
            streak = 0 if r.won else streak + 1
    return out


Condition = Callable[[RoundInContext], bool]


def _not_pistol(c: RoundInContext) -> bool:
    return c.fact.buy is not BuyType.PISTOL


def _gap(c: RoundInContext) -> float:
    return c.fact.loadout - c.fact.opp_loadout


def round_drivers(
    rounds: Sequence[RoundFact], deaths: Sequence[DeathFact], top_rounds: Sequence[RoundFact], top_deaths: Sequence[DeathFact]
) -> list[DriverGroup]:
    squad = with_context(squad_only(rounds))
    top = with_context(top_rounds)
    first_deaths = {(d.match_id, d.team_id, d.round_index): d for d in list(deaths) + list(top_deaths) if d.opening}

    def first_death_traded(c: RoundInContext) -> bool | None:
        death = first_deaths.get((c.fact.match_id, c.fact.team_id, c.fact.round_index))
        return None if c.fact.first_kill is not False or death is None else death.traded

    groups: list[tuple[str, list[tuple[str, Condition]]]] = [
        ("Après la first death", [
            ("First death avec revenge", lambda c: first_death_traded(c) is True),
            ("First death sans revenge", lambda c: first_death_traded(c) is False),
        ]),
        ("Votre équipement face au leur (hors pistols)", [
            ("1 000 crédits de moins, ou pire", lambda c: _not_pistol(c) and _gap(c) <= -1000),
            ("300 à 1 000 crédits de moins", lambda c: _not_pistol(c) and -1000 < _gap(c) <= -300),
            ("Équivalent (à 300 crédits près)", lambda c: _not_pistol(c) and abs(_gap(c)) < 300),
            ("300 à 1 000 crédits de plus", lambda c: _not_pistol(c) and 300 <= _gap(c) < 1000),
            ("1 000 crédits de plus, ou mieux", lambda c: _not_pistol(c) and _gap(c) >= 1000),
        ]),
        ("Momentum (hors pistols)", [
            ("Juste après un round gagné", lambda c: _not_pistol(c) and c.previous_won is True),
            ("Juste après un round perdu", lambda c: _not_pistol(c) and c.previous_won is False and c.loss_streak == 1),
            ("Après 2 rounds perdus d'affilée ou plus", lambda c: _not_pistol(c) and c.loss_streak >= 2),
        ]),
        ("Score au début du round", [
            ("Menés de 3 rounds ou plus", lambda c: c.lead <= -3),
            ("Menés de 1 ou 2 rounds", lambda c: -3 < c.lead < 0),
            ("À égalité", lambda c: c.lead == 0),
            ("Devant de 1 ou 2 rounds", lambda c: 0 < c.lead < 3),
            ("Devant de 3 rounds ou plus", lambda c: c.lead >= 3),
        ]),
        ("Moment du match", [
            ("Première mi-temps", lambda c: c.fact.round_index < 12),
            ("Seconde mi-temps", lambda c: 12 <= c.fact.round_index < 24),
            ("Prolongations", lambda c: c.fact.round_index >= 24),
        ]),
    ]  # fmt: skip
    return [
        DriverGroup(
            title=title,
            rows=[
                DriverRow(
                    label=label,
                    squad=rate((c for c in squad if condition(c)), lambda c: c.fact.won),
                    top=rate((c for c in top if condition(c)), lambda c: c.fact.won),
                )
                for label, condition in conditions
            ],
        )
        for title, conditions in groups
    ]
