"""Player situations: gaps against the top ranked of his role, priced in rounds."""

from tests.report_cohorts import make_cohorts
from tests.report_facts import player_match, player_round
from valostats.analysis.report.players.situations import player_situations
from valostats.domain.enums import Cohort, Side


def test_an_opening_duel_costs_what_it_changes_to_the_round():
    # Top ranked duelists: first bloods win the round, first deaths lose it (worth 1 round), 3 of 4 won.
    top = [
        player_round(
            match_id="t1", round_index=i, cohort=Cohort.TOP, name="Zulu", side=Side.ATTACK, first_blood=i < 3, first_death=i >= 3, won=i < 3
        )
        for i in range(4)
    ]
    # Alpha (Jett): 1 first blood out of 4 attack duels.
    own = [player_round(round_index=i, side=Side.ATTACK, first_blood=i == 0, first_death=i > 0, won=i == 0) for i in range(4)]
    cohorts = make_cohorts(player_rounds=own, player_matches=[player_match()], top_player_rounds=top)
    player = cohorts.players()[0]
    duel = next(s for s in player_situations(cohorts, player) if s.key == "duel-attack")
    assert (duel.k, duel.n, duel.top) == (1, 4, 0.75)
    assert duel.gap == -2.0
    assert duel.cost == -2.0
