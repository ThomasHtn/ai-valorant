"""Matches view: the period's matches by evening, and one match with both scoreboards and its round strip."""

from collections import defaultdict
from collections.abc import Iterable, Sequence
from dataclasses import dataclass, field
from datetime import date

from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohorts
from valostats.analysis.report.overview.evenings import evenings
from valostats.analysis.report.rounds.loss_causes import loss_cause
from valostats.domain.enums import Cohort
from valostats.domain.facts import MatchFact, PlayerMatchFact, PlayerRoundFact, RoundFact
from valostats.schemas.report.matches import (
    EveningMatches,
    LineupLine,
    MatchDetail,
    MatchList,
    MatchSummary,
    RoundStripCell,
    ScoreboardLine,
)


@dataclass
class MatchRecords:
    """Every fact of one squad match, both teams."""

    squad: MatchFact
    opponents: MatchFact | None = None
    # Squad rounds, in round order.
    rounds: list[RoundFact] = field(default_factory=list)
    player_rounds: list[PlayerRoundFact] = field(default_factory=list)
    player_matches: list[PlayerMatchFact] = field(default_factory=list)


def index_matches(
    matches: Iterable[MatchFact],
    rounds: Iterable[RoundFact],
    player_rounds: Iterable[PlayerRoundFact],
    player_matches: Iterable[PlayerMatchFact],
) -> dict[str, MatchRecords]:
    """Facts of the squad's matches grouped by match id (one pass over each list)."""
    matches = list(matches)
    records = {m.match_id: MatchRecords(squad=m) for m in matches if m.cohort is Cohort.SQUAD}
    for m in matches:
        if m.cohort is Cohort.OPPONENT and m.match_id in records:
            records[m.match_id].opponents = m
    for r in rounds:
        if r.cohort is Cohort.SQUAD and r.match_id in records:
            records[r.match_id].rounds.append(r)
    for p in player_rounds:
        if p.match_id in records:
            records[p.match_id].player_rounds.append(p)
    for pm in player_matches:
        if pm.match_id in records:
            records[pm.match_id].player_matches.append(pm)
    for record in records.values():
        record.rounds.sort(key=lambda r: r.round_index)
    return records


def match_list(cohorts: ReportCohorts) -> MatchList:
    """Evenings of the period, newest first, each with its matches oldest first."""
    groups = [
        EveningMatches(
            day=evening.day,
            wins=evening.wins,
            losses=evening.losses,
            matches=[_summary(cohorts, m) for m in evening.matches],
        )
        for evening in evenings(cohorts.matches())
    ]
    return MatchList(evenings=list(reversed(groups)))


def _summary(cohorts: ReportCohorts, match: MatchFact) -> MatchSummary:
    """One match of the list, with what its card sums up: opening duels and the lineup."""
    rounds: Sequence[RoundFact] = cohorts.squad(FactKind.ROUNDS, match_id=match.match_id)
    player_rounds: Sequence[PlayerRoundFact] = cohorts.squad(FactKind.PLAYER_ROUNDS, match_id=match.match_id)
    by_player: defaultdict[str, list[PlayerRoundFact]] = defaultdict(list)
    for p in player_rounds:
        by_player[p.puuid].append(p)
    lineup = [_lineup_line(pm, by_player[pm.puuid]) for pm in cohorts.squad(FactKind.PLAYER_MATCHES, match_id=match.match_id)]
    return MatchSummary(
        match_id=match.match_id,
        started_at=match.started_at,
        map_name=match.map_name,
        won=match.won,
        rounds_won=match.rounds_won,
        rounds_lost=match.rounds_lost,
        length_ms=match.length_ms,
        opening_won=sum(r.first_kill is True for r in rounds),
        opening_lost=sum(r.first_kill is False for r in rounds),
        lineup=sorted(lineup, key=lambda line: -line.acs),
    )


def _lineup_line(player: PlayerMatchFact, rounds: Sequence[PlayerRoundFact]) -> LineupLine:
    played = len(rounds) or player.rounds
    return LineupLine(
        name=player.name,
        agent=player.agent,
        acs=round(player.score / played, 1) if played else 0.0,
        kills=sum(r.kills for r in rounds),
        deaths=sum(r.deaths for r in rounds),
    )


def match_detail(record: MatchRecords, day: date) -> MatchDetail:
    """One match seen from the squad; `day` is the day of its evening."""
    match, opponents = record.squad, record.opponents
    return MatchDetail(
        match_id=match.match_id,
        day=day,
        started_at=match.started_at,
        map_name=match.map_name,
        patch=match.patch,
        won=match.won,
        rounds_won=match.rounds_won,
        rounds_lost=match.rounds_lost,
        start_side=match.start_side,
        length_ms=match.length_ms,
        cluster=match.cluster,
        tier=match.tier,
        opp_tier=match.opp_tier,
        squad=scoreboard(record, Cohort.SQUAD),
        opponents=scoreboard(record, Cohort.OPPONENT) if opponents else [],
        rounds=[
            RoundStripCell(
                round_number=r.round_index + 1,
                side=r.side,
                won=r.won,
                buy=r.buy,
                opp_buy=r.opp_buy,
                result=r.result,
                ceremony=r.ceremony,
                cause=loss_cause(r),
                max_advantage=r.max_advantage,
                planted=r.planted,
                plant_site=r.plant_site,
            )
            for r in record.rounds
        ],
    )


def scoreboard(record: MatchRecords, cohort: Cohort) -> list[ScoreboardLine]:
    """One line per player of a team, best ACS first."""
    rounds_by_player: defaultdict[str, list[PlayerRoundFact]] = defaultdict(list)
    for p in record.player_rounds:
        if p.cohort is cohort:
            rounds_by_player[p.puuid].append(p)
    lines = [_line(pm, rounds_by_player[pm.puuid]) for pm in record.player_matches if pm.cohort is cohort]
    return sorted(lines, key=lambda line: -line.acs)


def _line(player: PlayerMatchFact, rounds: Sequence[PlayerRoundFact]) -> ScoreboardLine:
    played = len(rounds) or player.rounds
    shots = sum(r.shots for r in rounds)
    return ScoreboardLine(
        name=player.name,
        agent=player.agent,
        rank=player.tier_name,
        acs=round(player.score / played, 1) if played else 0.0,
        kills=sum(r.kills for r in rounds),
        deaths=sum(r.deaths for r in rounds),
        assists=sum(r.assists for r in rounds),
        adr=round(sum(r.damage for r in rounds) / played, 1) if played else 0.0,
        kast=round(sum(r.kast for r in rounds) / len(rounds), 3) if rounds else None,
        headshot_rate=round(sum(r.headshots for r in rounds) / shots, 3) if shots else None,
        first_bloods=sum(r.first_blood for r in rounds),
        first_deaths=sum(r.first_death for r in rounds),
    )
