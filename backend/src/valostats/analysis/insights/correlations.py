"""What goes with the squad's wins: correlations between per-match stats and the share of rounds won.

Stats that are pieces of the result (post-plants, retakes, clutches) are left out, since they would
correlate with winning by construction.
"""

from collections import defaultdict
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from statistics import median

from valostats.analysis.statistics.correlation import pearson
from valostats.analysis.team.match_results import squad_only
from valostats.constants.analysis import EARLY_DEATH_MS
from valostats.constants.game import TEAM_SIZE
from valostats.domain.enums import BuyType, Side
from valostats.domain.facts import DeathFact, PlayerMatchFact, PlayerRoundFact, RoundFact
from valostats.schemas.period.insights import Correlations, PlayerCorrelation, StatCorrelation


@dataclass(frozen=True)
class MatchFacts:
    rounds: list[RoundFact]
    deaths: list[DeathFact]
    players: list[PlayerRoundFact]
    player_matches: list[PlayerMatchFact]


def _share(flags: Sequence[bool]) -> float | None:
    return sum(flags) / len(flags) if flags else None


def _headshots(m: MatchFacts) -> float | None:
    shots = sum(p.shots for p in m.players)
    return sum(p.headshots for p in m.players) / shots if shots else None


def _casts_per_player_round(m: MatchFacts) -> float | None:
    if not m.rounds or not m.player_matches:
        return None
    casts = sum(p.grenade_casts + p.ability1_casts + p.ability2_casts for p in m.player_matches)
    return casts / (len(m.rounds) * TEAM_SIZE)


MATCH_STATS: list[tuple[str, Callable[[MatchFacts], float | None]]] = [
    ("First blood pris", lambda m: _share([bool(r.first_kill) for r in m.rounds if r.first_kill is not None])),
    ("Morts avec revenge", lambda m: _share([d.traded for d in m.deaths])),
    ("Morts à 0 dégât", lambda m: _share([d.damage == 0 for d in m.deaths])),
    ("ADR équipe", lambda m: sum(p.damage for p in m.players) / len(m.players) if m.players else None),
    ("Headshots", _headshots),
    ("Utilitaire par joueur et par round (C, Q, E)", _casts_per_player_round),
    (
        "Rounds d'attaque avec plant (hors eco)",
        lambda m: _share([r.planted for r in m.rounds if r.side is Side.ATTACK and r.buy is not BuyType.ECO]),
    ),
    ("Pistols gagnés", lambda m: _share([r.won for r in m.rounds if r.buy is BuyType.PISTOL])),
    ("Morts avant 25 s", lambda m: _share([d.ms < EARLY_DEATH_MS for d in m.deaths])),
]


def correlations(
    rounds: Sequence[RoundFact],
    deaths: Sequence[DeathFact],
    player_rounds: Sequence[PlayerRoundFact],
    player_matches: Sequence[PlayerMatchFact],
) -> Correlations:
    per_match = _squad_match_facts(rounds, deaths, player_rounds, player_matches)
    win_rate = {mid: sum(r.won for r in m.rounds) / len(m.rounds) for mid, m in per_match.items()}

    team = []
    for label, stat in MATCH_STATS:
        pairs = [(value, win_rate[mid]) for mid, m in per_match.items() if (value := stat(m)) is not None]
        team.append(StatCorrelation(label=label, r=pearson([p[0] for p in pairs], [p[1] for p in pairs]), matches=len(pairs)))
    team.sort(key=lambda c: -abs(c.r) if c.r is not None else 0)

    acs_pairs: dict[str, list[tuple[float, float]]] = defaultdict(list)
    for mid, m in per_match.items():
        for name in {p.name for p in m.players}:
            scores = [p.score for p in m.players if p.name == name]
            acs_pairs[name].append((sum(scores) / len(scores), win_rate[mid]))
    players = []
    for name, pairs in sorted(acs_pairs.items(), key=lambda kv: -len(kv[1])):
        mid_acs = median(a for a, _ in pairs)
        high = [w for a, w in pairs if a >= mid_acs]
        low = [w for a, w in pairs if a < mid_acs]
        players.append(
            PlayerCorrelation(
                name=name,
                matches=len(pairs),
                r=pearson([a for a, _ in pairs], [w for _, w in pairs]),
                win_rate_high_acs=sum(high) / len(high) if high else None,
                win_rate_low_acs=sum(low) / len(low) if low else None,
            )
        )
    return Correlations(team=team, players=players)


def _squad_match_facts(
    rounds: Sequence[RoundFact],
    deaths: Sequence[DeathFact],
    player_rounds: Sequence[PlayerRoundFact],
    player_matches: Sequence[PlayerMatchFact],
) -> dict[str, MatchFacts]:
    grouped: dict[str, MatchFacts] = {}
    for r in squad_only(rounds):
        grouped.setdefault(r.match_id, MatchFacts([], [], [], [])).rounds.append(r)
    for d in squad_only(deaths):
        if d.match_id in grouped:
            grouped[d.match_id].deaths.append(d)
    for p in squad_only(player_rounds):
        if p.match_id in grouped:
            grouped[p.match_id].players.append(p)
    for pm in squad_only(player_matches):
        if pm.match_id in grouped:
            grouped[pm.match_id].player_matches.append(pm)
    return grouped
