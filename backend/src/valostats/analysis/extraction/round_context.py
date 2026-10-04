"""Where a round stands in its match: score before it, previous results, pistol context."""

from dataclasses import dataclass

from valostats.analysis.extraction.henrik_payload import HenrikMatch, other_team, played_rounds
from valostats.constants.game import HALF_LENGTH, OVERTIME_START, TEAMS


@dataclass(frozen=True, slots=True)
class RoundContext:
    """Seen from one team, before the round is played."""

    score_diff: int
    previous_won: bool | None
    previous_losses: int
    # Rounds 2 and 3 of each regular half only.
    pistol_won: bool | None
    second_round_won: bool | None


def round_contexts(match: HenrikMatch) -> dict[tuple[int, str], RoundContext]:
    """Context of every round for both teams, keyed by (round index, team id)."""
    winners = {rnd["id"]: rnd["winning_team"] for rnd in played_rounds(match)}
    contexts: dict[tuple[int, str], RoundContext] = {}
    won = dict.fromkeys(TEAMS, 0)
    losses_in_row = dict.fromkeys(TEAMS, 0)
    for index in sorted(winners):
        half_start = _half_start(index)
        for team in TEAMS:
            previous = winners.get(index - 1)
            pistol = winners.get(half_start) if half_start is not None and index in (half_start + 1, half_start + 2) else None
            second = winners.get(index - 1) if half_start is not None and index == half_start + 2 else None
            contexts[(index, team)] = RoundContext(
                score_diff=won[team] - won[other_team(team)],
                previous_won=None if previous is None else previous == team,
                previous_losses=losses_in_row[team],
                pistol_won=None if pistol is None else pistol == team,
                second_round_won=None if second is None else second == team,
            )
        for team in TEAMS:
            if winners[index] == team:
                won[team] += 1
                losses_in_row[team] = 0
            else:
                losses_in_row[team] += 1
    return contexts


def _half_start(index: int) -> int | None:
    """First round of the regular half the round belongs to; None in overtime."""
    if index >= OVERTIME_START:
        return None
    return 0 if index < HALF_LENGTH else HALF_LENGTH
