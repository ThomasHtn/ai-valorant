"""Pistol rounds, what follows them, and results by buy against buy."""

from collections import Counter
from collections.abc import Sequence

from valostats.analysis.statistics.rates import rate
from valostats.analysis.team.match_results import opponents_only, squad_only
from valostats.constants.game import PISTOL_ROUNDS
from valostats.domain.enums import BuyType, Cohort, Side
from valostats.domain.facts import RoundFact
from valostats.schemas.common import Rate
from valostats.schemas.period.team import BuyMatchup, BuyShare, Economy, PistolFollowUp, SideRate

BUYS = (BuyType.ECO, BuyType.FORCE, BuyType.FULL)


def economy(rounds: Sequence[RoundFact], top_rounds: Sequence[RoundFact]) -> Economy:
    squad = squad_only(rounds)
    pistols = [
        SideRate(
            side=side,
            squad=rate((r for r in squad if r.buy is BuyType.PISTOL and r.side is side), lambda r: r.won),
            top=rate((r for r in top_rounds if r.buy is BuyType.PISTOL and r.side is side), lambda r: r.won),
        )
        for side in Side
    ]
    squad_after, top_after = _after_pistol(squad), _after_pistol(top_rounds)
    after_pistol = [
        PistolFollowUp(pistol_won=won, rounds_after=k, squad=squad_after[(won, k)], top=top_after[(won, k)])
        for won in (True, False)
        for k in (1, 2)
    ]
    matrix = [
        BuyMatchup(
            own_buy=mine,
            opp_buy=theirs,
            squad=rate((r for r in squad if r.buy is mine and r.opp_buy is theirs), lambda r: r.won),
            top=rate((r for r in top_rounds if r.buy is mine and r.opp_buy is theirs), lambda r: r.won),
        )
        for mine in BUYS
        for theirs in BUYS
    ]
    shares = [
        _buy_share(cohort, rows)
        for cohort, rows in ((Cohort.SQUAD, squad), (Cohort.OPPONENT, opponents_only(rounds)), (Cohort.TOP, top_rounds))
    ]
    return Economy(pistols=pistols, after_pistol=after_pistol, buy_matrix=matrix, buy_shares=shares)


def _after_pistol(rounds: Sequence[RoundFact]) -> dict[tuple[bool, int], Rate]:
    """After a pistol won / lost: win rate of the next one and two rounds, both halves."""
    # Keyed by the in-game team: top ranked rows share one cohort for both teams.
    by_round = {(r.match_id, r.team_id, r.round_index): r for r in rounds}
    counts = {(won, k): [0, 0] for won in (True, False) for k in (1, 2)}
    for r in rounds:
        if r.round_index not in PISTOL_ROUNDS:
            continue
        for k in (1, 2):
            following = by_round.get((r.match_id, r.team_id, r.round_index + k))
            if following:
                counts[(r.won, k)][0] += following.won
                counts[(r.won, k)][1] += 1
    return {key: Rate(count=c, total=n) for key, (c, n) in counts.items()}


def _buy_share(cohort: Cohort, rounds: Sequence[RoundFact]) -> BuyShare:
    bought = [r for r in rounds if r.buy is not BuyType.PISTOL]
    counts = Counter(r.buy for r in bought)
    return BuyShare(
        cohort=cohort,
        eco=Rate(count=counts[BuyType.ECO], total=len(bought)),
        force=Rate(count=counts[BuyType.FORCE], total=len(bought)),
        full=Rate(count=counts[BuyType.FULL], total=len(bought)),
    )
