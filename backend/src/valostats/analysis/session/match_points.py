"""Recurring mistakes and unusual results of one session match, compared with the squad's habits."""

from collections.abc import Mapping, Sequence

from valostats.analysis.session.history import SideHabits, squad_side
from valostats.constants.analysis import MIN_SESSION_HISTORY, THROW_ADVANTAGE
from valostats.domain.enums import Cohort, KillerCohort, Side, Tone
from valostats.domain.facts import DeathFact, RoundFact
from valostats.schemas.common import Rate
from valostats.schemas.session import SessionPoint

# A player's first death spot is recurring after this many times in the history.
MIN_PLAYER_SPOT_HISTORY = 4
# A team first death spot is recurring after this many times, and twice tonight.
MIN_TEAM_SPOT_HISTORY = 5
MIN_TEAM_SPOT_TONIGHT = 2
# Tonight differs from the habit by at least this much, on at least this many tries.
UNUSUAL_GAP = 0.15
MIN_UNUSUAL_TRIES = 5


def percent(r: Rate) -> str:
    return f"{round(100 * r.count / r.total)} %" if r.total else "-"


def _differs(tonight: Rate, usual: Rate) -> bool:
    return (
        tonight.total >= MIN_UNUSUAL_TRIES
        and usual.total >= MIN_SESSION_HISTORY
        and abs(tonight.count / tonight.total - usual.count / usual.total) >= UNUSUAL_GAP
    )


def _revenges(deaths: Sequence[DeathFact]) -> str:
    return f"revenge {sum(d.traded for d in deaths)}/{len(deaths)}"


def match_points(
    match_id: str, map_name: str, rounds: Sequence[RoundFact], deaths: Sequence[DeathFact], profile: Mapping[tuple[str, Side], SideHabits]
) -> tuple[list[SessionPoint], list[SessionPoint]]:
    """(recurring, unusual) points of one match."""
    recurring: list[SessionPoint] = []
    unusual: list[SessionPoint] = []
    match_deaths = [d for d in deaths if d.match_id == match_id and not d.teamkill]
    for side in Side:
        habits = profile.get((map_name, side))
        rs = [r for r in rounds if r.match_id == match_id and r.cohort is Cohort.SQUAD and r.side is side]
        if not habits or not rs:
            continue
        habit = f"déjà {{n}} fois sur vos {habits.matches} autres {map_name}"
        squad_deaths = [d for d in match_deaths if d.cohort is Cohort.SQUAD and d.side is side]
        openings = [d for d in squad_deaths if d.opening]

        flagged = set()
        for (spot, name), n_history in habits.player_first_death_spots.most_common():
            tonight = [d for d in openings if d.callout == spot and d.name == name]
            if n_history >= MIN_PLAYER_SPOT_HISTORY and tonight:
                flagged.add(spot)
                detail = " · ".join([", ".join(f"R{d.round_index + 1}" for d in tonight), _revenges(tonight), habit.format(n=n_history)])
                recurring.append(SessionPoint(side=side, tone=Tone.BAD, title=f"First death de {name} à {spot}", detail=detail))
        for spot, n_history in habits.first_death_spots.most_common():
            tonight = [d for d in openings if d.callout == spot]
            if n_history >= MIN_TEAM_SPOT_HISTORY and len(tonight) >= MIN_TEAM_SPOT_TONIGHT and spot not in flagged:
                detail = " · ".join(
                    [", ".join(f"{d.name} R{d.round_index + 1}" for d in tonight), _revenges(tonight), habit.format(n=n_history)]
                )
                recurring.append(SessionPoint(side=side, tone=Tone.BAD, title=f"{len(tonight)} first deaths à {spot}", detail=detail))

        def compare(title: str, tonight: Rate, usual: Rate) -> None:
            if _differs(tonight, usual):
                up = tonight.count / tonight.total > usual.count / usual.total
                tone = Tone.GOOD if up else Tone.BAD
                unusual.append(SessionPoint(side=side, tone=tone, title=title, detail=f"d'habitude {percent(usual)} sur {map_name}"))

        duels = [d for d in match_deaths if d.opening and squad_side(d) == side]
        won_duels = Rate(count=sum(d.killer_cohort is KillerCohort.SQUAD for d in duels), total=len(duels))
        compare(f"First blood : {won_duels.count}/{won_duels.total}", won_duels, habits.opening_won)
        traded = Rate(count=sum(d.traded for d in squad_deaths), total=len(squad_deaths))
        compare(f"Revenge : {traded.count}/{traded.total} morts", traded, habits.traded)
        planted = [r for r in rs if r.planted]
        plant_won = Rate(count=sum(r.won for r in planted), total=len(planted))
        compare(
            f"{'Retakes' if side is Side.DEFENSE else 'Post-plants'} : {plant_won.count}/{plant_won.total}", plant_won, habits.plant_won
        )

        throws = [r for r in rs if r.max_advantage >= THROW_ADVANTAGE and not r.won]
        if len(throws) >= max(2, round(habits.throws_per_match * 2)):
            usual = "moins d'une fois" if habits.throws_per_match < 1 else f"environ {habits.throws_per_match:.0f} fois"
            refs = ", ".join(f"R{r.round_index + 1}" for r in throws)
            unusual.append(
                SessionPoint(side=side, tone=Tone.BAD, title=f"{len(throws)} throws en avantage 2+ (5v3, 4v2…)",
                             detail=f"{refs} · d'habitude {usual} par match")
            )  # fmt: skip
    return recurring, unusual
