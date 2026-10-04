"""Domain "Économie": buy split and matchups, player buying habits, buys by round type, pistol loadouts.

Buys follow the team's average loadout (constants/game.py): eco under 1 500 credits, full buy from
3 700, force buy in between. Player rows read their team's buy through `TeamRounds`.
"""

from collections import Counter
from collections.abc import Callable, Sequence
from typing import Any

from valostats.analysis.extraction.economy import buy_type
from valostats.analysis.report.domains._lookups import TeamRounds, cell_from_measures, measured_cell, role_facts
from valostats.analysis.report.domains._players import player_art, role_label
from valostats.analysis.report.foundation.art import weapon_art
from valostats.analysis.report.foundation.cells import Metric, cell, mean, ratio
from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohort, ReportCohorts, SquadPlayer
from valostats.analysis.report.foundation.table_builder import TableBuilder
from valostats.constants.game import PISTOL_ROUNDS
from valostats.constants.weapons import CLASS_OF_GUN, HEAVY_ARMOR, PISTOL_ARMORS, WEAPON_CLASSES
from valostats.domain.enums import BuyType
from valostats.domain.facts import PlayerRoundFact, RoundFact
from valostats.schemas.report.tables import StatCell, StatTable, ValueFormat

RoundFilter = Callable[[RoundFact], bool]

# Matchups and pistol loadouts are small samples: colour from 10.
MIN_SPLIT_SAMPLE = 10
# Player habits: about 2 matches of rounds.
MIN_HABIT_SAMPLE = 40

BUYS: tuple[tuple[BuyType, str], ...] = ((BuyType.ECO, "Eco"), (BuyType.FORCE, "Force buy"), (BuyType.FULL, "Full buy"))
BUY_TEXT = {BuyType.PISTOL: "pistol", BuyType.ECO: "eco", BuyType.FORCE: "force buy", BuyType.FULL: "full buy"}

# Rounds 2 and 3 of each half (0-based).
SECOND_ROUNDS = (1, 13)
THIRD_ROUNDS = (2, 14)
OVERTIME_START = 24


def _mid_half(r: RoundFact) -> bool:
    """A round whose buy depends on the previous losses only: no pistol, no round 2-3, no overtime."""
    return r.buy is not BuyType.PISTOL and r.round_index not in (*SECOND_ROUNDS, *THIRD_ROUNDS) and r.round_index < OVERTIME_START


ROUND_TYPES: tuple[tuple[str, str, RoundFilter], ...] = (
    ("pistol", "Pistol", lambda r: r.buy is BuyType.PISTOL),
    ("r2w", "R2 après pistol gagné", lambda r: r.round_index in SECOND_ROUNDS and r.pistol_won is True),
    ("r2l", "R2 après pistol perdu", lambda r: r.round_index in SECOND_ROUNDS and r.pistol_won is False),
    ("r3b", "R3 bonus", lambda r: r.round_index in THIRD_ROUNDS and r.pistol_won is True and r.second_round_won is True),
    ("after1", "Après 1 round perdu", lambda r: _mid_half(r) and r.previous_losses == 1),
    ("after2", "Après 2 rounds perdus ou plus", lambda r: _mid_half(r) and r.previous_losses >= 2),
)


def tables(cohorts: ReportCohorts) -> list[StatTable]:
    team_rounds = TeamRounds(cohorts)
    return [
        _buy_split(cohorts),
        _buy_matrix(cohorts),
        _by_player(cohorts, team_rounds),
        _by_round_type(cohorts, team_rounds),
        _pistol_armor(cohorts),
        _pistol_weapon(cohorts),
    ]


def _won(r: Any) -> bool:
    return bool(r.won)


def _buy_is(buy: BuyType) -> RoundFilter:
    return lambda r: r.buy is buy


def _matchup(own: BuyType, opp: BuyType) -> RoundFilter:
    return lambda r: r.buy is own and r.opp_buy is opp


def _wears(armor: str | None) -> Callable[[PlayerRoundFact], bool]:
    return lambda p: p.armor == armor


def _holds(weapon: str) -> Callable[[PlayerRoundFact], bool]:
    return lambda p: p.weapon == weapon


def _not_pistol(r: RoundFact) -> bool:
    return r.buy is not BuyType.PISTOL


def _buy_split(cohorts: ReportCohorts) -> StatTable:
    table = TableBuilder("eco-split", "Répartition des achats (hors pistols)", "Achat", help="ecoBuySplit").column(
        "share", "Part des rounds", better=0, help="ecoBuySplit"
    )
    for buy, label in BUYS:
        table.row(buy.value, label, {"share": cell(cohorts, FactKind.ROUNDS, ratio(_buy_is(buy), _not_pistol))})
    return table.build()


def _buy_matrix(cohorts: ReportCohorts) -> StatTable:
    table = TableBuilder("eco-matrix", "Rounds gagnés selon les deux achats", "Votre achat", help="ecoBuyMatrix")
    for buy, label in BUYS:
        table.column(f"vs_{buy.value}", f"Contre {label.lower()}", help="ecoBuyMatrix", min=MIN_SPLIT_SAMPLE)
    for own, label in BUYS:
        table.row(
            own.value,
            label,
            {f"vs_{opp.value}": cell(cohorts, FactKind.ROUNDS, ratio(_won, _matchup(own, opp))) for opp, _ in BUYS},
        )
    return table.build()


# Buying habits of a player: key, label, format, direction and glossary key; shared with the player sheet.
HABITS: tuple[tuple[str, str, ValueFormat, int, str], ...] = (
    ("loadout", "Valeur moyenne du loadout", ValueFormat.INTEGER, 0, "ecoLoadout"),
    ("remaining", "Crédits restants en full buy", ValueFormat.INTEGER, -1, "ecoRemaining"),
    ("mismatch", "Achat différent de l'équipe", ValueFormat.PERCENT, -1, "ecoBuyMismatch"),
    ("heavy", "Armure lourde en full buy", ValueFormat.PERCENT, 1, "ecoHeavyArmor"),
    ("lost", "Valeur perdue par round perdu", ValueFormat.INTEGER, -1, "ecoLostValue"),
)


def habit_metrics(team_rounds: TeamRounds) -> dict[str, Metric]:
    """How each habit of `HABITS` is measured on a player's non-pistol rounds."""

    def team_buy(p: PlayerRoundFact) -> BuyType | None:
        team_round = team_rounds.of(p)
        return team_round.buy if team_round else None

    def in_full_buy(p: PlayerRoundFact) -> bool:
        return team_buy(p) is BuyType.FULL

    def buys_apart(p: PlayerRoundFact) -> bool:
        # The player's own buy class, from his loadout alone, differs from the team's.
        team = team_buy(p)
        return team is not None and buy_type(p.round_index, [p.loadout]) is not team

    return {
        "loadout": mean(lambda p: p.loadout),
        "remaining": mean(lambda p: p.remaining, in_full_buy),
        "mismatch": ratio(buys_apart, lambda p: team_buy(p) is not None),
        "heavy": ratio(lambda p: p.armor == HEAVY_ARMOR, in_full_buy),
        # Equipment lost: the loadout of a player who died in a lost round, 0 when he survived.
        "lost": mean(lambda p: p.loadout if p.deaths else 0, lambda p: not p.won),
    }


def _by_player(cohorts: ReportCohorts, team_rounds: TeamRounds) -> StatTable:
    table = TableBuilder("eco-players", "Habitudes d'achat par joueur (hors pistols)", "Joueur", help="ecoLoadout")
    for key, label, value_format, better, help_key in HABITS:
        table.column(key, label, value_format, better, help=help_key, min=MIN_HABIT_SAMPLE)
    metrics = habit_metrics(team_rounds)
    role_cache: dict[tuple[ReportCohort, str], list[PlayerRoundFact]] = {}
    for player in cohorts.players():
        facts = non_pistol_player_facts(cohorts, player, role_cache)
        table.row(
            player.name,
            player.name,
            {key: measured_cell(metric, facts) for key, metric in metrics.items()},
            art=player_art(player),
            sub=role_label(player),
        )
    return table.build()


def non_pistol_player_facts(
    cohorts: ReportCohorts, player: SquadPlayer, role_cache: dict[tuple[ReportCohort, str], list[PlayerRoundFact]]
) -> dict[ReportCohort, Sequence[PlayerRoundFact]]:
    """The player's non-pistol rounds (squad, hist) and those of his role (top, opp), role lists shared between players."""

    def keep(facts: Sequence[PlayerRoundFact]) -> list[PlayerRoundFact]:
        return [p for p in facts if p.round_index not in PISTOL_ROUNDS]

    out: dict[ReportCohort, Sequence[PlayerRoundFact]] = {
        ReportCohort.SQUAD: keep(cohorts.select(FactKind.PLAYER_ROUNDS, ReportCohort.SQUAD, name=player.name)),
        ReportCohort.HISTORY: keep(cohorts.select(FactKind.PLAYER_ROUNDS, ReportCohort.HISTORY, name=player.name)),
    }
    for cohort in (ReportCohort.TOP, ReportCohort.OPPONENTS):
        key = (cohort, player.role)
        if key not in role_cache:
            role_cache[key] = keep(role_facts(cohorts, FactKind.PLAYER_ROUNDS, cohort, player.role))
        out[cohort] = role_cache[key]
    return out


def _by_round_type(cohorts: ReportCohorts, team_rounds: TeamRounds) -> StatTable:
    # "R2 après pistol gagné" is often a "force buy" by loadout (SMG and light armor stay under 3 700
    # credits): the main weapon class column says what was actually bought.
    table = (
        TableBuilder("eco-round-types", "Achat selon le type de round", "Type de round", help="ecoRoundTypes")
        .column("buy", "Achat le plus fréquent", ValueFormat.TEXT, 0, help="ecoRoundTypes", min=0)
        .column("weapon", "Arme principale la plus jouée", ValueFormat.TEXT, 0, help="ecoWeaponClass", min=0)
        .column("loadout", "Valeur moyenne du loadout", ValueFormat.INTEGER, 0, help="ecoTeamLoadout")
        .column("rw", "Rounds gagnés", help="ecoRoundTypes")
    )
    weapon_classes = _weapon_classes_by_round_type(cohorts, team_rounds)
    for key, label, among in ROUND_TYPES:
        rounds = {c: [r for r in cohorts.select(FactKind.ROUNDS, c) if among(r)] for c in ReportCohort}
        # The pistol buy is the same for everyone: no "most frequent buy" to show.
        buys = {c: None if key == "pistol" else _most_common(Counter(BUY_TEXT[r.buy] for r in rs)) for c, rs in rounds.items()}
        table.row(
            key,
            label,
            {
                "buy": _text_cell(buys, {c: len(rs) for c, rs in rounds.items()}),
                "weapon": _text_cell(
                    {c: _most_common(weapon_classes[c][key]) for c in ReportCohort},
                    {c: weapon_classes[c][key].total() for c in ReportCohort},
                ),
                "loadout": cell(cohorts, FactKind.ROUNDS, mean(lambda r: r.loadout, among)),
                "rw": cell(cohorts, FactKind.ROUNDS, ratio(_won, among)),
            },
        )
    return table.build()


def _weapon_classes_by_round_type(cohorts: ReportCohorts, team_rounds: TeamRounds) -> dict[ReportCohort, dict[str, Counter[str]]]:
    """Weapon classes held by the players, per cohort and round type, in one pass over the player-rounds."""
    out: dict[ReportCohort, dict[str, Counter[str]]] = {}
    for cohort in ReportCohort:
        counters: dict[str, Counter[str]] = {key: Counter() for key, _, _ in ROUND_TYPES}
        for p in cohorts.select(FactKind.PLAYER_ROUNDS, cohort):
            weapon_class = CLASS_OF_GUN.get(p.weapon or "")
            team_round = team_rounds.of(p) if weapon_class else None
            if team_round is None or weapon_class is None:
                continue
            for key, _, among in ROUND_TYPES:
                if among(team_round):
                    counters[key][weapon_class] += 1
        out[cohort] = counters
    return out


def _most_common(counts: Counter[str]) -> str | None:
    """'force buy 62 %': the most frequent label and its share."""
    if not counts:
        return None
    label, n = counts.most_common(1)[0]
    return f"{label} {round(100 * n / counts.total())} %"


def _text_cell(texts: dict[ReportCohort, str | None], samples: dict[ReportCohort, int]) -> StatCell:
    return cell_from_measures({cohort: (texts[cohort], samples[cohort]) for cohort in ReportCohort})


def _pistol_facts(cohorts: ReportCohorts) -> dict[ReportCohort, list[PlayerRoundFact]]:
    return {c: [p for i in PISTOL_ROUNDS for p in cohorts.select(FactKind.PLAYER_ROUNDS, c, round_index=i)] for c in ReportCohort}


def _pistol_armor(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("eco-pistol-armor", "Armure au pistol", "Armure", help="ecoPistolLoadout")
        .column("share", "Part des joueurs", better=0, help="ecoPistolLoadout")
        .column("rw", "Pistols gagnés", help="ecoPistolWon", min=MIN_SPLIT_SAMPLE)
    )
    facts = _pistol_facts(cohorts)
    for key, label, armor in PISTOL_ARMORS:
        table.row(
            key,
            label,
            {
                "share": measured_cell(ratio(_wears(armor)), facts),
                "rw": measured_cell(ratio(_won, _wears(armor)), facts),
            },
        )
    return table.build()


def _pistol_weapon(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("eco-pistol-weapon", "Arme au pistol", "Arme", help="ecoPistolLoadout")
        .column("share", "Part des joueurs", better=0, help="ecoPistolLoadout")
        .column("rw", "Pistols gagnés", help="ecoPistolWon", min=MIN_SPLIT_SAMPLE)
    )
    facts = _pistol_facts(cohorts)
    for weapon in WEAPON_CLASSES[0][2]:
        table.row(
            weapon,
            weapon,
            {
                "share": measured_cell(ratio(_holds(weapon)), facts),
                "rw": measured_cell(ratio(_won, _holds(weapon)), facts),
            },
            art=weapon_art(weapon),
        )
    return table.build()
