"""Plants and retakes: where, when, and with how many players alive."""

from collections import Counter
from collections.abc import Callable, Sequence

from valostats.analysis.statistics.rates import rate
from valostats.analysis.team.match_results import squad_only
from valostats.constants.analysis import MIN_TOP_REFERENCE_ROUNDS
from valostats.domain.enums import Side
from valostats.domain.facts import RoundFact
from valostats.schemas.common import Rate, RateVsReference
from valostats.schemas.period.team import PlantNumbersRow, SiteRow, Sites, TempoRow

TEMPO = (("Rapide (< 40 s)", 0, 40_000), ("Moyen (40-70 s)", 40_000, 70_000), ("Tardif (> 70 s)", 70_000, 10**9))
NUMBERS_AT_PLANT: tuple[tuple[str, Callable[[int], bool]], ...] = (
    ("2 de moins ou pire", lambda a: a <= -2),
    ("1 de moins", lambda a: a == -1),
    ("À égalité", lambda a: a == 0),
    ("1 de plus", lambda a: a == 1),
    ("2 de plus ou mieux", lambda a: a >= 2),
)


def sites(rounds: Sequence[RoundFact], top_rounds: Sequence[RoundFact]) -> Sites:
    squad = squad_only(rounds)
    return Sites(rows=_site_rows(squad, top_rounds), tempo=_tempo(squad, top_rounds), numbers_at_plant=_numbers(squad, top_rounds))


def _site_rows(squad: Sequence[RoundFact], top_rounds: Sequence[RoundFact]) -> list[SiteRow]:
    # Reference: the same map and site in top ranked games, or all top ranked plants when they are too few.
    all_post_plants = rate((r for r in top_rounds if r.side is Side.ATTACK and r.planted), lambda r: r.won)
    all_retakes = rate((r for r in top_rounds if r.side is Side.DEFENSE and r.planted), lambda r: r.won)
    rows = []
    for map_name, _ in Counter(r.map_name for r in squad).most_common():
        attack = [r for r in squad if r.map_name == map_name and r.side is Side.ATTACK and r.planted]
        defense = [r for r in squad if r.map_name == map_name and r.side is Side.DEFENSE and r.planted]
        top_attack = [r for r in top_rounds if r.map_name == map_name and r.side is Side.ATTACK and r.planted]
        top_defense = [r for r in top_rounds if r.map_name == map_name and r.side is Side.DEFENSE and r.planted]
        for site in sorted({r.plant_site for r in attack + defense if r.plant_site}):
            ours = [r for r in attack if r.plant_site == site]
            theirs = [r for r in defense if r.plant_site == site]
            top_ours = [r for r in top_attack if r.plant_site == site]
            post_plant_ref = rate(top_ours, lambda r: r.won) if len(top_ours) >= MIN_TOP_REFERENCE_ROUNDS else all_post_plants
            retake_ref = rate((r for r in top_defense if r.plant_site == site), lambda r: r.won)
            if retake_ref.total < MIN_TOP_REFERENCE_ROUNDS:
                retake_ref = all_retakes
            rows.append(
                SiteRow(
                    map_name=map_name,
                    site=site,
                    plant_share=Rate(count=len(ours), total=len(attack)),
                    top_plant_share=Rate(count=len(top_ours), total=len(top_attack)) if top_attack else None,
                    post_plant=RateVsReference(squad=rate(ours, lambda r: r.won), reference=post_plant_ref),
                    plants_against_share=Rate(count=len(theirs), total=len(defense)),
                    retake=RateVsReference(squad=rate(theirs, lambda r: r.won), reference=retake_ref),
                )
            )
    return rows


def _tempo(squad: Sequence[RoundFact], top_rounds: Sequence[RoundFact]) -> list[TempoRow]:
    plants = [r for r in squad if r.side is Side.ATTACK and r.planted]
    top_plants = [r for r in top_rounds if r.side is Side.ATTACK and r.planted]
    rows = []
    for label, low, high in TEMPO:
        ours = [r for r in plants if r.plant_ms is not None and low <= r.plant_ms < high]
        theirs = [r for r in top_plants if r.plant_ms is not None and low <= r.plant_ms < high]
        rows.append(
            TempoRow(
                label=label,
                share=Rate(count=len(ours), total=len(plants)),
                top_share=Rate(count=len(theirs), total=len(top_plants)),
                won=rate(ours, lambda r: r.won),
                top_won=rate(theirs, lambda r: r.won),
            )
        )
    return rows


def _numbers(squad: Sequence[RoundFact], top_rounds: Sequence[RoundFact]) -> list[PlantNumbersRow]:
    def won(rows: Sequence[RoundFact], side: Side, test: Callable[[int], bool]) -> Rate:
        return rate(
            (r for r in rows if r.side is side and r.advantage_at_plant is not None and test(r.advantage_at_plant)), lambda r: r.won
        )

    return [
        PlantNumbersRow(
            label=label,
            post_plant=won(squad, Side.ATTACK, test),
            top_post_plant=won(top_rounds, Side.ATTACK, test),
            retake=won(squad, Side.DEFENSE, test),
            top_retake=won(top_rounds, Side.DEFENSE, test),
        )
        for label, test in NUMBERS_AT_PLANT
    ]
