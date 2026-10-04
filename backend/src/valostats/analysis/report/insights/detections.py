"""Automatic detections: what the period shows on its own, without interpretation.

- repetitions: first deaths in the same zone (only zones above top ranked), the same cause of lost rounds
  on a map and side, the same advantage thrown, at least REPETITION_MIN_COUNT times over
  REPETITION_MIN_MATCHES matches;
- links: the team's rounds won after each player's first blood or first death (against his teammates'), and with his ACS above
  or below his median.
"""

import statistics
from collections import Counter, defaultdict
from collections.abc import Callable, Sequence

from valostats.analysis.report.foundation.art import map_art, player_art
from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohort, ReportCohorts
from valostats.analysis.report.insights.rewatch import rewatch_rounds
from valostats.analysis.report.rounds.loss_causes import loss_cause
from valostats.analysis.statistics.proportions import proportions_p_value
from valostats.constants.findings import (
    ACS_LINK_MIN_MATCHES,
    MAX_REWATCH,
    REPETITION_MIN_COUNT,
    REPETITION_MIN_MATCHES,
    ZONE_EXCESS_MIN_SHARE,
)
from valostats.domain.enums import LossCause, Side
from valostats.domain.facts import MatchFact, RoundFact
from valostats.schemas.common import Rate
from valostats.schemas.report.detections import (
    AcsGroup,
    Detections,
    Link,
    LinkKind,
    PlayerCount,
    Repetition,
    RepetitionKind,
)
from valostats.schemas.report.findings import RewatchRound

SIDE_LABELS = {Side.ATTACK: "attaque", Side.DEFENSE: "défense"}
# French names of the loss causes, used in the repetition labels.
CAUSE_LABELS = {
    LossCause.LEAD_THROWN: "Avantage perdu",
    LossCause.CLUTCH_LOST: "Clutch perdu",
    LossCause.POST_PLANT_LOST: "Post-plant perdu",
    LossCause.RETAKE_FAILED: "Retake raté",
    LossCause.OPENING_LOST: "Ouverture perdue",
    LossCause.ECONOMY_GAP: "Écart économique",
    LossCause.TIME_OUT: "Temps écoulé",
    LossCause.EXECUTE_FAILED: "Exécution ratée",
    LossCause.DUELS_LOST: "Duels perdus",
}


def detections(cohorts: ReportCohorts) -> Detections:
    return Detections(
        repetitions=zone_first_deaths(cohorts) + repeated_loss_causes(cohorts) + thrown_situations(cohorts),
        links=first_duel_links(cohorts) + acs_links(cohorts),
    )


def is_repeated(count: int, matches: int) -> bool:
    return count >= REPETITION_MIN_COUNT and matches >= REPETITION_MIN_MATCHES


def zone_first_deaths(cohorts: ReportCohorts) -> list[Repetition]:
    """First deaths in the same zone of a map and side, kept when the squad dies there first more often than top ranked."""
    first_deaths = [k for k in cohorts.squad(FactKind.DEATHS) if k.opening]
    by_zone = _group(first_deaths, lambda k: (k.map_name, k.victim_side, k.victim_zone))
    by_scope = Counter((k.map_name, k.victim_side) for k in first_deaths)
    top_by_zone: Counter[tuple[str, Side, str]] = Counter()
    top_by_scope: Counter[tuple[str, Side]] = Counter()
    for kill in cohorts.select(FactKind.DEATHS, ReportCohort.TOP):
        if kill.opening:
            top_by_zone[(kill.map_name, kill.victim_side, kill.victim_zone)] += 1
            top_by_scope[(kill.map_name, kill.victim_side)] += 1
    out = []
    for (map_name, side, zone), kills in by_zone.items():
        matches = len({k.match_id for k in kills})
        if not is_repeated(len(kills), matches):
            continue
        top_total = top_by_scope[(map_name, side)]
        share = len(kills) / by_scope[(map_name, side)]
        top_share = top_by_zone[(map_name, side, zone)] / top_total if top_total else None
        # A zone where top ranked die first just as often is the map's usual contact point, not a habit.
        if top_share is not None and share - top_share < ZONE_EXCESS_MIN_SHARE:
            continue
        out.append(
            Repetition(
                kind=RepetitionKind.ZONE_FIRST_DEATHS,
                label=f"{len(kills)} first deaths à {zone}",
                scope=f"{map_name} · {SIDE_LABELS[side]}",
                art=map_art(map_name),
                map_name=map_name,
                side=side,
                count=len(kills),
                matches=matches,
                base_rounds=len(cohorts.squad(FactKind.ROUNDS, map_name=map_name, side=side)),
                zone=zone,
                share=round(share, 3),
                top_share=round(top_share, 3) if top_share is not None else None,
                avenged=sum(k.avenged for k in kills),
                players=[PlayerCount(name=n, count=c) for n, c in Counter(k.victim for k in kills).most_common()],
                rewatch=rewatch_rounds(kills),
            )
        )
    return sorted(out, key=lambda r: -((r.share or 0) - (r.top_share or 0)))


def repeated_loss_causes(cohorts: ReportCohorts) -> list[Repetition]:
    """The same cause of lost rounds on a map and side ("Duels perdus", the catch-all, is left out)."""
    lost = [r for r in cohorts.squad(FactKind.ROUNDS) if not r.won]
    out = []
    for (cause, map_name, side), rounds in _group(lost, lambda r: (loss_cause(r), r.map_name, r.side)).items():
        matches = len({r.match_id for r in rounds})
        if cause is None or cause is LossCause.DUELS_LOST or not is_repeated(len(rounds), matches):
            continue
        out.append(
            Repetition(
                kind=RepetitionKind.LOSS_CAUSE,
                label=f"{CAUSE_LABELS[cause]} {len(rounds)} fois",
                scope=f"{map_name} · {SIDE_LABELS[side]}",
                art=map_art(map_name),
                map_name=map_name,
                side=side,
                count=len(rounds),
                matches=matches,
                base_rounds=len(cohorts.squad(FactKind.ROUNDS, map_name=map_name, side=side)),
                cause=cause,
                rewatch=rewatch_rounds(rounds),
            )
        )
    return sorted(out, key=lambda r: -r.count)


def thrown_situations(cohorts: ReportCohorts) -> list[Repetition]:
    """Advantage situations (e.g. 4v3) the squad reached and still lost, against the opponents' rate."""
    squad_rounds = cohorts.squad(FactKind.ROUNDS)
    opp_rounds = cohorts.select(FactKind.ROUNDS, ReportCohort.OPPONENTS)
    lost_by_state: dict[str, list[RoundFact]] = defaultdict(list)
    for r in squad_rounds:
        if not r.won:
            for state in r.states:
                own, opp = (int(n) for n in state.split("v"))
                if own > opp:
                    lost_by_state[state].append(r)
    out = []
    for state, lost in lost_by_state.items():
        matches = len({r.match_id for r in lost})
        if not is_repeated(len(lost), matches):
            continue
        reached = sum(1 for r in squad_rounds if state in r.states)
        opp_reached = [r for r in opp_rounds if state in r.states]
        out.append(
            Repetition(
                kind=RepetitionKind.SITUATION_LOST,
                label=f"{state} perdu {len(lost)} fois",
                scope="Toutes les cartes",
                art=None,
                map_name=None,
                side=None,
                count=len(lost),
                matches=matches,
                base_rounds=reached,
                state=state,
                lost_share=round(len(lost) / reached, 3),
                opp_lost_share=round(sum(not r.won for r in opp_reached) / len(opp_reached), 3) if opp_reached else None,
                opp_rounds=len(opp_reached),
                rewatch=rewatch_rounds(lost),
            )
        )
    return sorted(out, key=lambda r: -r.count)


def first_duel_links(cohorts: ReportCohorts) -> list[Link]:
    """Rounds won after each player's first blood and first death, against his teammates' rate after theirs."""
    rounds = cohorts.squad(FactKind.ROUNDS)
    team_rounds = {
        LinkKind.FIRST_BLOOD: [r for r in rounds if r.first_kill is True],
        LinkKind.FIRST_DEATH: [r for r in rounds if r.first_kill is False],
    }
    labels = {
        LinkKind.FIRST_BLOOD: "Rounds gagnés après son first blood",
        LinkKind.FIRST_DEATH: "Rounds gagnés après sa first death",
    }
    out = []
    for player in cohorts.players():
        mine = [p for p in cohorts.squad(FactKind.PLAYER_ROUNDS) if p.name == player.name]
        for kind, event in ((LinkKind.FIRST_BLOOD, "first_blood"), (LinkKind.FIRST_DEATH, "first_death")):
            facts = [p for p in mine if getattr(p, event)]
            # The player's own rounds stay out of the reference, else he is partly compared with himself.
            own = {(p.match_id, p.round_index) for p in facts}
            others = [r for r in team_rounds[kind] if (r.match_id, r.round_index) not in own]
            value, reference = _rate(facts, lambda p: p.won), _rate(others, lambda r: r.won)
            if not value.total or value.value is None or reference.value is None:
                continue
            below_team = value.value < reference.value
            out.append(
                Link(
                    kind=kind,
                    player=player.name,
                    art=player_art(player.name),
                    label=labels[kind],
                    value=value,
                    team=reference,
                    gap_rounds=round((value.value - reference.value) * value.total, 1),
                    p_value=round(proportions_p_value(value.count, value.total, reference.count, reference.total), 4),
                    rewatch=rewatch_rounds([p for p in facts if p.won != below_team]),
                )
            )
    return out


def acs_links(cohorts: ReportCohorts) -> list[Link]:
    """The team's rounds won in each player's matches above vs below his median ACS."""
    matches: dict[str, MatchFact] = {m.match_id: m for m in cohorts.squad(FactKind.MATCHES)}
    out = []
    for player in cohorts.players():
        acs = {p.match_id: p.score / p.rounds for p in cohorts.squad(FactKind.PLAYER_MATCHES) if p.name == player.name and p.rounds}
        if len(acs) < ACS_LINK_MIN_MATCHES:
            continue
        middle = statistics.median(acs.values())
        above = _acs_group([matches[m] for m, a in acs.items() if a > middle and m in matches])
        below = _acs_group([matches[m] for m, a in acs.items() if a <= middle and m in matches])
        worst = sorted((matches[m] for m, a in acs.items() if a <= middle and m in matches), key=lambda m: m.started_at, reverse=True)
        out.append(
            Link(
                kind=LinkKind.ACS_MEDIAN,
                player=player.name,
                art=player_art(player.name),
                label="Rounds gagnés selon son ACS",
                median_acs=round(middle, 1),
                above=above,
                below=below,
                p_value=round(proportions_p_value(above.rounds.count, above.rounds.total, below.rounds.count, below.rounds.total), 4),
                rewatch=[
                    RewatchRound(match_id=m.match_id, day=m.started_at.date(), map_name=m.map_name, round_number=None)
                    for m in worst[:MAX_REWATCH]
                ],
            )
        )
    return out


def _acs_group(matches: Sequence[MatchFact]) -> AcsGroup:
    return AcsGroup(
        rounds=Rate(count=sum(m.rounds_won for m in matches), total=sum(m.rounds for m in matches)),
        matches=len(matches),
        match_wins=sum(m.won for m in matches),
    )


def _rate[T](facts: Sequence[T], success: Callable[[T], bool]) -> Rate:
    return Rate(count=sum(1 for f in facts if success(f)), total=len(facts))


def _group[T, K](facts: Sequence[T], key: Callable[[T], K]) -> dict[K, list[T]]:
    grouped: dict[K, list[T]] = defaultdict(list)
    for fact in facts:
        grouped[key(fact)].append(fact)
    return grouped
