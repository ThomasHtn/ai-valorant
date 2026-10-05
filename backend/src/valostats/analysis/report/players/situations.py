"""Situations of a player against the top ranked of his role, each priced in rounds.

A duel, a death or a clutch is worth what it changes to the round for the top ranked: the round win
rate when it goes well minus when it does not. A player who wins 5 opening duels fewer than a top
ranked player of his role on the same duels thus costs about 5 x (worth of an opening duel) rounds.
"""

from collections.abc import Callable, Sequence
from dataclasses import dataclass

from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohort, ReportCohorts, SquadPlayer
from valostats.constants.agents import role_of
from valostats.domain.enums import Side
from valostats.domain.facts import PlayerRoundFact
from valostats.schemas.report.player import PlayerSituation

Test = Callable[[PlayerRoundFact], bool]


@dataclass(frozen=True)
class SituationRule:
    key: str
    label: str
    detail: str
    unit: str
    among: Test
    success: Test
    better: int = 1


def _opening(side: Side) -> Test:
    return lambda r: r.side is side and (r.first_blood or r.first_death)


RULES: tuple[SituationRule, ...] = (
    SituationRule(
        "duel-attack",
        "Premier duel en attaque",
        "premiers duels gagnés en attaque",
        "duels",
        _opening(Side.ATTACK),
        lambda r: r.first_blood,
    ),
    SituationRule(
        "duel-defense",
        "Premier duel en défense",
        "premiers duels gagnés en défense",
        "duels",
        _opening(Side.DEFENSE),
        lambda r: r.first_blood,
    ),
    SituationRule(
        "traded",
        "Morts tradées",
        "un coéquipier tue son adversaire juste après",
        "morts",
        lambda r: r.deaths > 0,
        lambda r: r.traded,
    ),
    SituationRule(
        "zero-damage",
        "Morts sans dégâts",
        "mort avant d'avoir touché un adversaire, plus bas = mieux",
        "morts",
        lambda r: r.deaths > 0,
        lambda r: r.zero_damage_death,
        better=-1,
    ),
    SituationRule(
        "clutch",
        "Clutchs",
        "rounds gagnés seul contre un ou plusieurs adversaires",
        "clutchs",
        lambda r: r.clutch_versus > 0,
        lambda r: r.clutch_won,
    ),
)


def player_situations(cohorts: ReportCohorts, player: SquadPlayer) -> list[PlayerSituation]:
    own = [r for r in cohorts.squad(FactKind.PLAYER_ROUNDS) if r.name == player.name]
    top = [r for r in cohorts.select(FactKind.PLAYER_ROUNDS, ReportCohort.TOP) if role_of(r.agent) == player.role]
    lines = [_situation(rule, own, top) for rule in RULES]
    return sorted(lines, key=lambda s: (s.cost is None, s.cost or 0))


def _situation(rule: SituationRule, own: Sequence[PlayerRoundFact], top: Sequence[PlayerRoundFact]) -> PlayerSituation:
    mine = [r for r in own if rule.among(r)]
    theirs = [r for r in top if rule.among(r)]
    k = sum(1 for r in mine if rule.success(r))
    top_rate = sum(1 for r in theirs if rule.success(r)) / len(theirs) if theirs else None
    gap = round((k - len(mine) * top_rate) * rule.better, 1) if top_rate is not None and mine else None
    worth = _worth(theirs, rule.success)
    # Worth is measured on the success itself: a lower-is-better success costs rounds when it happens.
    cost = round(gap * abs(worth), 1) if gap is not None and worth is not None else None
    return PlayerSituation(
        key=rule.key,
        label=rule.label,
        detail=rule.detail,
        unit=rule.unit,
        better=rule.better,
        k=k,
        n=len(mine),
        top=top_rate,
        gap=gap,
        cost=cost,
    )


def _worth(facts: Sequence[PlayerRoundFact], success: Test) -> float | None:
    """Round win rate of the top ranked when the situation goes one way minus the other."""
    yes = [r.won for r in facts if success(r)]
    no = [r.won for r in facts if not success(r)]
    if not yes or not no:
        return None
    return sum(yes) / len(yes) - sum(no) / len(no)
