"""Match facts: one row per team and match (score, lineup, ranks, context)."""

from collections.abc import Iterable

from valostats.analysis.extraction.context import MatchContext
from valostats.analysis.extraction.henrik_payload import attacker, cluster, game_length_ms, other_team, team_tiers
from valostats.constants.game import TEAMS
from valostats.domain.enums import Side
from valostats.domain.facts import MatchFact


def extract_matches(contexts: Iterable[MatchContext]) -> list[MatchFact]:
    facts: list[MatchFact] = []
    for ctx in contexts:
        match = ctx.match
        # Scores are counted from the rounds: the payload's team score is missing in some old matches.
        won_rounds = dict.fromkeys(TEAMS, 0)
        for rnd in match["rounds"]:
            if rnd["winning_team"] in won_rounds:
                won_rounds[rnd["winning_team"]] += 1
        team_won = {t["team_id"]: t["won"] for t in match["teams"]}
        tiers = team_tiers(match)
        for team in TEAMS:
            other = other_team(team)
            players = [p for p in match["players"] if p["team_id"] == team]
            opponents = [p for p in match["players"] if p["team_id"] == other]
            facts.append(
                MatchFact(
                    **ctx.base,
                    cohort=ctx.cohort_of(team),
                    team_id=team,
                    won=team_won.get(team, False),
                    rounds_won=won_rounds[team],
                    rounds_lost=won_rounds[other],
                    start_side=Side.ATTACK if attacker(0) == team else Side.DEFENSE,
                    lineup=tuple(sorted((p["name"] for p in players), key=str.lower)),
                    agents=tuple(sorted(p["agent"]["name"] for p in players)),
                    opp_agents=tuple(sorted(p["agent"]["name"] for p in opponents)),
                    tier=tiers[team],
                    opp_tier=tiers[other],
                    length_ms=game_length_ms(match),
                    cluster=cluster(match),
                )
            )
    return facts
