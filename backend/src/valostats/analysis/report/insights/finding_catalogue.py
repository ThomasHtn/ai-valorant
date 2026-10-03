"""Every comparison the Points forts et faibles view tests, team first, then each squad player.

References follow the module docstring of `findings.py`: round outcomes and meta against top ranked,
non zero-sum team play and player figures against the opponents. Labels are French (shown as is).
"""

from valostats.analysis.report.foundation.art import map_art, player_art
from valostats.analysis.report.foundation.cohorts import ReportCohorts, SquadPlayer
from valostats.analysis.report.foundation.death_rules import has_living_teammate, is_isolated
from valostats.analysis.report.insights.finding_tests import FindingTest, Predicate, Unit, always
from valostats.constants.findings import FAST_PLANT_MS, SECOND_ROUNDS, TESTED_STATES, THIRD_ROUNDS
from valostats.domain.enums import BuyType, Reference, Side
from valostats.domain.facts import KillFact, PlayerRoundFact, RoundFact
from valostats.schemas.report.findings import FindingGroup

SIDE_LABELS = {Side.ATTACK: "attaque", Side.DEFENSE: "défense"}

# Scope of a team test: label, map, side.
Scope = tuple[str, str | None, Side | None]


def finding_catalogue(cohorts: ReportCohorts) -> list[FindingTest]:
    return team_tests(cohorts.maps()) + [t for p in cohorts.players() for t in player_tests(p)]


def team_tests(maps: list[str]) -> list[FindingTest]:
    scopes: list[Scope] = [("Global", None, None)]
    scopes += [(SIDE_LABELS[s].capitalize(), None, s) for s in Side]
    scopes += [(m, m, None) for m in maps]
    scopes += [(f"{m} · {SIDE_LABELS[s]}", m, s) for m in maps for s in Side]
    map_scopes: list[Scope] = [("Global", None, None), *((m, m, None) for m in maps)]
    tests: list[FindingTest] = []
    for scope in scopes:
        tests += _opening_tests(scope)
        tests += _team_play_tests(scope)
    for scope in map_scopes:
        tests += _spike_tests(scope)
    for state in TESTED_STATES:
        for label, side in [("Global", None), *((SIDE_LABELS[s].capitalize(), s) for s in Side)]:
            tests.append(_team(f"{label} · {state}", f"Rounds gagnés après un {state}", "situation", Unit.ROUNDS, _won,
                               _reached(state), Reference.TOP, side=side, round_outcome=True))  # fmt: skip
    for label, among in ROUND_TYPES:
        tests.append(_team(label, "Rounds gagnés", "roundType", Unit.ROUNDS, _won, among, Reference.TOP, round_outcome=True))
    tests.append(_team("Global", "Morts sans dégâts", "zeroDamage", Unit.PLAYER_ROUNDS, _zero_damage, _died, Reference.OPPONENTS))
    return tests


def player_tests(player: SquadPlayer) -> list[FindingTest]:
    scopes = [(player.name, None), *((f"{player.name} · {SIDE_LABELS[s]}", s) for s in Side)]
    tests: list[FindingTest] = []
    for scope, side in scopes:
        tests.append(_player(player, scope, "First death par round", "firstDeath", Unit.PLAYER_ROUNDS, _first_death, always, side))
        tests.append(_player(player, scope, "First blood par round", "firstBlood", Unit.PLAYER_ROUNDS, _first_blood, always, side))
        tests.append(_player(player, scope, "KAST", "kast", Unit.PLAYER_ROUNDS, _kast, always, side))
    name = player.name
    tests.append(_player(player, name, "Morts sans dégâts", "zeroDamage", Unit.PLAYER_ROUNDS, _zero_damage, _died))
    tests.append(_player(player, name, "Morts avec revenge", "revenge", Unit.DEATHS, _avenged, always))
    tests.append(_player(player, name, "Morts isolées", "isolated", Unit.DEATHS, is_isolated, has_living_teammate))
    tests.append(_player(player, name, "Clutchs gagnés", "clutch", Unit.PLAYER_ROUNDS, _won, _clutch, round_outcome=True))
    return tests


def _opening_tests(scope: Scope) -> list[FindingTest]:
    tests = [
        _team(scope, "First blood pris", "opening", Unit.ROUNDS, _took_first_blood, _had_first_kill, Reference.TOP),
        _team(scope, "Rounds gagnés après first blood", "conversion", Unit.ROUNDS, _won, _took_first_blood, Reference.TOP,
              round_outcome=True),
        _team(scope, "Rounds gagnés après first death", "conversion", Unit.ROUNDS, _won, _suffered_first_death, Reference.TOP,
              round_outcome=True),
    ]  # fmt: skip
    # Per map or side only: top ranked gives the 50 % baseline (or the side's usual rate); the global record is in the header.
    if scope[0] != "Global":
        tests.insert(0, _team(scope, "Rounds gagnés", "rounds", Unit.ROUNDS, _won, always, Reference.TOP, round_outcome=True))
    return tests


def _team_play_tests(scope: Scope) -> list[FindingTest]:
    return [
        _team(scope, "Morts avec revenge", "revenge", Unit.DEATHS, _avenged, always, Reference.OPPONENTS),
        _team(scope, "Morts isolées", "isolated", Unit.DEATHS, is_isolated, has_living_teammate, Reference.OPPONENTS),
    ]


def _spike_tests(scope: Scope) -> list[FindingTest]:
    return [
        _team(scope, "Post-plant gagné", "postPlant", Unit.ROUNDS, _won, _attack_planted, Reference.TOP, round_outcome=True),
        _team(scope, "Retake gagné", "retake", Unit.ROUNDS, _won, _defense_planted, Reference.TOP, round_outcome=True),
        _team(scope, "Plant en attaque", "plant", Unit.ROUNDS, _planted, _attack, Reference.TOP),
        _team(scope, "Plant avant 30 s", "timing", Unit.ROUNDS, _fast_plant, _attack_planted, Reference.TOP),
    ]


def _team(
    scope: Scope | str,
    metric: str,
    kind: str,
    unit: Unit,
    success: Predicate,
    among: Predicate,
    reference: Reference,
    *,
    side: Side | None = None,
    round_outcome: bool = False,
) -> FindingTest:
    label, map_name, scope_side = (scope, None, None) if isinstance(scope, str) else scope
    return FindingTest(
        group=FindingGroup.TEAM,
        scope=label,
        metric=metric,
        kind=kind,
        unit=unit,
        success=success,
        among=among,
        reference=reference,
        map_name=map_name,
        side=side or scope_side,
        art=map_art(map_name) if map_name else None,
        round_outcome=round_outcome,
    )


def _player(
    player: SquadPlayer,
    scope: str,
    metric: str,
    kind: str,
    unit: Unit,
    success: Predicate,
    among: Predicate,
    side: Side | None = None,
    *,
    round_outcome: bool = False,
) -> FindingTest:
    return FindingTest(
        group=FindingGroup.PLAYERS,
        scope=scope,
        metric=metric,
        kind=kind,
        unit=unit,
        success=success,
        among=among,
        reference=Reference.OPPONENTS,
        side=side,
        player=player,
        art=player_art(player.name),
        round_outcome=round_outcome,
    )


# ---- predicates: small named functions keep the catalogue readable ----


def _won(fact: RoundFact | PlayerRoundFact) -> bool:
    return fact.won


def _had_first_kill(r: RoundFact) -> bool:
    return r.first_kill is not None


def _took_first_blood(r: RoundFact) -> bool:
    return r.first_kill is True


def _suffered_first_death(r: RoundFact) -> bool:
    return r.first_kill is False


def _attack(r: RoundFact) -> bool:
    return r.side is Side.ATTACK


def _planted(r: RoundFact) -> bool:
    return r.planted


def _attack_planted(r: RoundFact) -> bool:
    return r.side is Side.ATTACK and r.planted


def _defense_planted(r: RoundFact) -> bool:
    return r.side is Side.DEFENSE and r.planted


def _fast_plant(r: RoundFact) -> bool:
    return r.plant_ms is not None and r.plant_ms < FAST_PLANT_MS


def _avenged(k: KillFact) -> bool:
    return k.avenged


def _died(p: PlayerRoundFact) -> bool:
    return p.deaths > 0


def _zero_damage(p: PlayerRoundFact) -> bool:
    return p.zero_damage_death


def _first_death(p: PlayerRoundFact) -> bool:
    return p.first_death


def _first_blood(p: PlayerRoundFact) -> bool:
    return p.first_blood


def _kast(p: PlayerRoundFact) -> bool:
    return p.kast


def _reached(state: str) -> Predicate:
    """Rounds where the team went through a numbers situation, e.g. "4v3"."""

    def reached(r: RoundFact) -> bool:
        return state in r.states

    return reached


def _clutch(p: PlayerRoundFact) -> bool:
    return p.clutch_versus > 0


ROUND_TYPES: list[tuple[str, Predicate]] = [
    ("Pistol", lambda r: r.buy is BuyType.PISTOL),
    ("Eco", lambda r: r.buy is BuyType.ECO),
    ("Force buy", lambda r: r.buy is BuyType.FORCE),
    ("Full buy", lambda r: r.buy is BuyType.FULL),
    ("Full buy contre full buy", lambda r: r.buy is BuyType.FULL and r.opp_buy is BuyType.FULL),
    ("Full buy contre eco", lambda r: r.buy is BuyType.FULL and r.opp_buy is BuyType.ECO),
    ("R2 après pistol gagné", lambda r: r.round_index in SECOND_ROUNDS and r.pistol_won is True),
    ("R2 après pistol perdu", lambda r: r.round_index in SECOND_ROUNDS and r.pistol_won is False),
    ("R3 bonus", lambda r: r.round_index in THIRD_ROUNDS and r.pistol_won is True and r.second_round_won is True),
]
