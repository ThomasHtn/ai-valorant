"""Agent compositions: the squad's with their results, and the ones top ranked teams play."""

from collections import Counter, defaultdict
from collections.abc import Sequence

from valostats.constants.game import TEAM_SIZE
from valostats.domain.enums import Cohort
from valostats.domain.facts import PlayerMatchFact
from valostats.schemas.common import Rate
from valostats.schemas.period.insights import Composition, MapCompositions

# A composition is the sorted agents of one team, with whether that team won.
TeamComposition = tuple[tuple[str, ...], bool]

MAX_SQUAD_COMPOSITIONS = 3


def compositions_by_map(player_matches: Sequence[PlayerMatchFact], cohort: Cohort) -> dict[str, list[TeamComposition]]:
    teams: dict[tuple[str, str], list[PlayerMatchFact]] = defaultdict(list)
    for p in player_matches:
        if p.cohort is cohort:
            teams[(p.match_id, p.team_id)].append(p)
    by_map: dict[str, list[TeamComposition]] = defaultdict(list)
    for players in teams.values():
        if len(players) == TEAM_SIZE:
            by_map[players[0].map_name].append((tuple(sorted(p.agent for p in players)), players[0].won))
    return by_map


def count_compositions(compositions: Sequence[TeamComposition], limit: int) -> list[Composition]:
    return [
        Composition(agents=list(agents), matches=n, wins=sum(won for c, won in compositions if c == agents))
        for agents, n in Counter(c for c, _ in compositions).most_common(limit)
    ]


def compositions(player_matches: Sequence[PlayerMatchFact], top_player_matches: Sequence[PlayerMatchFact]) -> list[MapCompositions]:
    """Per map, most played first: the squad's top compositions and the most played one in top ranked games."""
    mine = compositions_by_map(player_matches, Cohort.SQUAD)
    top = compositions_by_map(top_player_matches, Cohort.TOP)
    rows = []
    for map_name in sorted(mine, key=lambda m: -len(mine[m])):
        most_played = Counter(c for c, _ in top.get(map_name, [])).most_common(1)
        rows.append(
            MapCompositions(
                map_name=map_name,
                squad=count_compositions(mine[map_name], MAX_SQUAD_COMPOSITIONS),
                top_most_played=list(most_played[0][0]) if most_played else None,
                top_share=Rate(count=most_played[0][1], total=len(top[map_name])) if most_played else None,
            )
        )
    return rows
