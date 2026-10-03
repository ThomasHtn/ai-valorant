"""Why a round was lost, read from its round fact. The rules are tried in order and the first one wins.

1. Avantage perdu: the team led by 2 players or more.
2. Clutch perdu: the round reached a 1v1.
3. Post-plant perdu: attack, spike planted while equal or ahead, then defused.
4. Retake raté: defense, enemy plant while equal or ahead (seen from the defense), round lost.
5. Ouverture perdue: first death without revenge, and the team never got back to equal numbers.
6. Écart économique: eco or force buy against a full buy.
7. Temps écoulé: attack lost without a plant while attackers were still alive.
8. Exécution ratée: attack lost without a plant.
9. Duels perdus: anything else.
"""

from valostats.constants.rounds import LEAD_THROWN_ADVANTAGE
from valostats.domain.enums import BuyType, LossCause, Side
from valostats.domain.facts import RoundFact

# Opening state of every round, left out when checking whether the team got back to equal numbers.
_START_STATE = "5v5"


def loss_cause(fact: RoundFact) -> LossCause | None:
    """Cause of a lost round, None for a won round."""
    if fact.won:
        return None
    attack = fact.side is Side.ATTACK
    even_or_ahead_at_plant = fact.planted and (fact.advantage_at_plant or 0) >= 0
    if fact.max_advantage >= LEAD_THROWN_ADVANTAGE:
        return LossCause.LEAD_THROWN
    if "1v1" in fact.states:
        return LossCause.CLUTCH_LOST
    if attack and even_or_ahead_at_plant and fact.defused:
        return LossCause.POST_PLANT_LOST
    if not attack and even_or_ahead_at_plant:
        return LossCause.RETAKE_FAILED
    if fact.first_kill is False and fact.first_death_avenged is False and _never_back_to_equal(fact.states):
        return LossCause.OPENING_LOST
    if fact.buy in (BuyType.ECO, BuyType.FORCE) and fact.opp_buy is BuyType.FULL:
        return LossCause.ECONOMY_GAP
    if fact.timeout:
        return LossCause.TIME_OUT
    if attack and not fact.planted:
        return LossCause.EXECUTE_FAILED
    return LossCause.DUELS_LOST


def _never_back_to_equal(states: tuple[str, ...]) -> bool:
    """True when every situation after the opening had the team outnumbered (e.g. 4v5, 3v4)."""
    for state in states:
        if state == _START_STATE:
            continue
        own, opp = (int(n) for n in state.split("v"))
        if own >= opp:
            return False
    return True
