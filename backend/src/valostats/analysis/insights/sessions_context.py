"""Results by rank of the match in the evening, start hour, weekday, lineup and presence of each player."""

from collections import Counter, defaultdict
from collections.abc import Callable, Iterable, Sequence

from valostats.analysis.team.match_results import MatchResult, squad_matches, squad_only
from valostats.constants.analysis import SESSION_GAP
from valostats.constants.labels import WEEKDAYS
from valostats.domain.facts import PlayerRoundFact, RoundFact
from valostats.schemas.common import MatchRecord, Rate
from valostats.schemas.period.insights import ContextRow, PresenceRow, SessionsContext


def match_record(matches: Iterable[MatchResult]) -> MatchRecord:
    matches = list(matches)
    wins = sum(m.won for m in matches)
    won_rounds = sum(m.rounds_won for m in matches)
    return MatchRecord(
        matches=len(matches),
        wins=wins,
        losses=len(matches) - wins,
        rounds=Rate(count=won_rounds, total=won_rounds + sum(m.rounds_lost for m in matches)),
    )


def sessions_context(rounds: Sequence[RoundFact], player_rounds: Sequence[PlayerRoundFact]) -> SessionsContext:
    matches = squad_matches(rounds)
    rank = _rank_in_evening(matches.values())
    lineups: dict[str, set[str]] = defaultdict(set)
    for p in squad_only(player_rounds):
        lineups[p.match_id].add(p.name)

    def rows(groups: Iterable[tuple[str, Callable[[MatchResult], bool]]]) -> list[ContextRow]:
        out = []
        for label, keep in groups:
            selected = [m for m in matches.values() if keep(m)]
            if selected:
                out.append(ContextRow(label=label, record=match_record(selected)))
        return out

    by_rank = rows([
        ("1er match", lambda m: rank[m.match_id] == 1),
        ("2e match", lambda m: rank[m.match_id] == 2),
        ("3e match", lambda m: rank[m.match_id] == 3),
        ("4e match et plus", lambda m: rank[m.match_id] >= 4),
    ])  # fmt: skip
    by_hour = rows([
        ("Avant 20 h", lambda m: m.started_at.hour < 20),
        ("20 h - 22 h", lambda m: 20 <= m.started_at.hour < 22),
        ("Après 22 h", lambda m: m.started_at.hour >= 22),
    ])  # fmt: skip
    by_weekday = rows((WEEKDAYS[day], _on_weekday(day)) for day in range(7))

    lineup_rows = []
    for names, _ in Counter(frozenset(v) for v in lineups.values()).most_common():
        selected = [matches[mid] for mid, v in lineups.items() if frozenset(v) == names and mid in matches]
        lineup_rows.append(ContextRow(label=", ".join(sorted(names, key=str.lower)), record=match_record(selected)))

    presence = []
    for name in sorted({n for v in lineups.values() for n in v}, key=str.lower):
        with_player = [matches[mid] for mid, v in lineups.items() if name in v and mid in matches]
        without = [matches[mid] for mid, v in lineups.items() if name not in v and mid in matches]
        if without:
            presence.append(PresenceRow(name=name, with_player=match_record(with_player), without_player=match_record(without)))

    return SessionsContext(by_rank_in_evening=by_rank, by_start_hour=by_hour, by_weekday=by_weekday, lineups=lineup_rows, presence=presence)


def _on_weekday(day: int) -> Callable[[MatchResult], bool]:
    return lambda m: m.started_at.weekday() == day


def _rank_in_evening(matches: Iterable[MatchResult]) -> dict[str, int]:
    """1 for the first match of an evening, 2 for the second…; an evening ends after a long gap."""
    ranks: dict[str, int] = {}
    rank, previous = 0, None
    for m in sorted(matches, key=lambda m: m.started_at):
        rank = rank + 1 if previous is not None and m.started_at - previous <= SESSION_GAP else 1
        ranks[m.match_id], previous = rank, m.started_at
    return ranks
