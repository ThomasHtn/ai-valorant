"""Domain "Combat": individual fight stats, multi-kills, value of kills, face-to-face, team combat by map."""

import statistics
from collections import Counter, defaultdict
from collections.abc import Callable, Sequence
from typing import Any

from valostats.analysis.report.domains._players import PlayerFacts, player_art, role_label
from valostats.analysis.report.foundation.art import map_art
from valostats.analysis.report.foundation.cells import cell, fixed, median, ratio, rounded, sum_ratio
from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohort, ReportCohorts, SquadPlayer
from valostats.analysis.report.foundation.table_builder import TableBuilder
from valostats.constants.agents import role_of
from valostats.constants.report_domains import (
    FACE_TO_FACE_OPPONENTS,
    MIN_CONSISTENCY_MATCHES,
    MIN_PLAYER_DEATHS,
    MIN_PLAYER_MATCHES,
    MIN_PLAYER_ROUNDS,
    MIN_SIDE_SAMPLE,
    MIN_TOP_CONSISTENCY_MATCHES,
)
from valostats.domain.enums import BuyType, Cohort, KillerCohort, Reference
from valostats.domain.facts import KillFact, PlayerMatchFact, PlayerRoundFact
from valostats.schemas.report.tables import StatCell, StatTable, ValueFormat

# Kills on a victim whose team bought this way; pistol rounds are left out.
KILL_VALUE_BUYS = (
    (BuyType.ECO, "eco", "Sur eco", -1),
    (BuyType.FORCE, "force", "Sur force buy", 0),
    (BuyType.FULL, "full", "Sur full buy", 1),
)
MULTI_KILL_SIZES = (2, 3, 4, 5)


def tables(cohorts: ReportCohorts) -> list[StatTable]:
    facts = PlayerFacts(cohorts)
    return [_by_player(cohorts, facts), _multi_kills(cohorts, facts), _kill_value(cohorts, facts), _face_to_face(cohorts), _by_map(cohorts)]


def _hits(p: PlayerRoundFact) -> int:
    return p.shots


def _died(p: PlayerRoundFact) -> bool:
    return p.deaths > 0


def _by_player(cohorts: ReportCohorts, facts: PlayerFacts) -> StatTable:
    per_round = ValueFormat.DECIMAL_2
    table = (
        TableBuilder("combat-players", "Combat par joueur", "Joueur", help="acs", note="Référence top ranked : joueurs du même rôle.")
        .count_column("matches", "Matchs")
        .count_column("rounds", "Rounds")
        .column("acs", "ACS", ValueFormat.DECIMAL_1, help="acs", min=MIN_PLAYER_ROUNDS)
        .column("kd", "K/D", per_round, help="kd", min=MIN_PLAYER_ROUNDS)
        .column("kpr", "Kills / round", per_round, help="killsPerRound", min=MIN_PLAYER_ROUNDS)
        .column("dpr", "Morts / round", per_round, -1, help="deathsPerRound", min=MIN_PLAYER_ROUNDS)
        .column("apr", "Assists / round", per_round, help="assistsPerRound", min=MIN_PLAYER_ROUNDS)
        .column("adr", "ADR", ValueFormat.DECIMAL_1, help="adr", min=MIN_PLAYER_ROUNDS)
        .column("dtr", "Dégâts subis / round", ValueFormat.DECIMAL_1, -1, help="damageTakenPerRound", min=MIN_PLAYER_ROUNDS)
        .column("eff", "Efficacité des dégâts", per_round, help="damageEfficiency", min=MIN_PLAYER_ROUNDS)
        .column("kast", "KAST", help="kast", min=MIN_PLAYER_ROUNDS)
        .column("hs", "HS %", help="headshotRate", min=MIN_PLAYER_ROUNDS)
        .column("hsIn", "HS subis %", better=-1, help="headshotTakenRate", min=MIN_PLAYER_ROUNDS)
        .column("zero", "Morts à 0 dégât", better=-1, help="zeroDamageDeaths", min=MIN_PLAYER_DEATHS)
        .column("surv", "Survie", help="survival", min=MIN_PLAYER_ROUNDS)
        .column("kdis", "Kills en infériorité / round", per_round, help="killsOutnumbered", min=MIN_PLAYER_ROUNDS)
        .column("multi", "Multi-kills", help="multiKillRate", min=MIN_PLAYER_ROUNDS)
        .column("reg", "Régularité (écart d'ACS)", ValueFormat.DECIMAL_1, -1, help="acsRegularity", min=MIN_PLAYER_MATCHES)
    )
    metrics = {
        "acs": sum_ratio(lambda p: p.score),
        "kd": sum_ratio(lambda p: p.kills, lambda p: p.deaths),
        "kpr": sum_ratio(lambda p: p.kills),
        "dpr": sum_ratio(lambda p: p.deaths),
        "apr": sum_ratio(lambda p: p.assists),
        "adr": sum_ratio(lambda p: p.damage),
        "dtr": sum_ratio(lambda p: p.damage_received),
        "eff": sum_ratio(lambda p: p.damage, lambda p: p.damage_received),
        "kast": ratio(lambda p: p.kast),
        "hs": sum_ratio(lambda p: p.headshots, _hits),
        "hsIn": sum_ratio(lambda p: p.headshots_received, lambda p: p.shots_received),
        "zero": ratio(lambda p: p.zero_damage_death, _died),
        "surv": ratio(lambda p: p.survived),
        "kdis": sum_ratio(lambda p: p.kills_outnumbered),
        "multi": ratio(lambda p: p.kills >= 2),
    }
    top_consistency = _top_consistency(cohorts)
    for player in cohorts.players():
        rounds = facts.of_player(FactKind.PLAYER_ROUNDS, ReportCohort.SQUAD, player.name)
        matches = facts.of_player(FactKind.PLAYER_MATCHES, ReportCohort.SQUAD, player.name)
        cells = {key: facts.cell(FactKind.PLAYER_ROUNDS, metric, player) for key, metric in metrics.items()}
        cells["matches"] = fixed(len(matches), len(matches))
        cells["rounds"] = fixed(len(rounds), len(rounds))
        cells["reg"] = _consistency_cell(facts, player, top_consistency.get(player.role, (None, 0)))
        table.row(player.name, player.name, cells, art=player_art(player), sub=role_label(player))
    return table.build()


def acs_spread(matches: Sequence[PlayerMatchFact]) -> tuple[float | None, int]:
    """Standard deviation of the ACS from one match to another (None under the minimum of matches)."""
    acs = [m.score / m.rounds for m in matches if m.rounds]
    return (statistics.pstdev(acs), len(acs)) if len(acs) >= MIN_CONSISTENCY_MATCHES else (None, len(acs))


def _top_consistency(cohorts: ReportCohorts) -> dict[str, tuple[float | None, int]]:
    """Per role: median ACS spread of the top ranked players with enough matches, and how many players."""
    by_player: defaultdict[tuple[str, str], list[PlayerMatchFact]] = defaultdict(list)
    for m in cohorts.select(FactKind.PLAYER_MATCHES, ReportCohort.TOP):
        by_player[(m.puuid, role_of(m.agent))].append(m)
    spreads: defaultdict[str, list[float]] = defaultdict(list)
    for (_, role), matches in by_player.items():
        spread, _ = acs_spread(matches)
        if len(matches) >= MIN_TOP_CONSISTENCY_MATCHES and spread is not None:
            spreads[role].append(spread)
    return {role: (statistics.median(values), len(values)) for role, values in spreads.items()}


def _consistency_cell(facts: PlayerFacts, player: SquadPlayer, top: tuple[float | None, int]) -> StatCell:
    own, own_n = acs_spread(facts.of_player(FactKind.PLAYER_MATCHES, ReportCohort.SQUAD, player.name))
    past, past_n = acs_spread(facts.of_player(FactKind.PLAYER_MATCHES, ReportCohort.HISTORY, player.name))
    return StatCell(v=rounded(own), n=own_n, top=rounded(top[0]), top_n=top[1], hist=rounded(past), hist_n=past_n)


def _multi_kills(cohorts: ReportCohorts, facts: PlayerFacts) -> StatTable:
    table = TableBuilder("combat-multikills", "Multi-kills par joueur", "Joueur", help="multiKills")
    for size in MULTI_KILL_SIZES:
        table.count_column(f"k{size}", f"{size}K" if size < 5 else "Aces", help="multiKills")
    table.column("speed", "Vitesse médiane des multi-kills", ValueFormat.SECONDS, 0, help="multiKillSpeed", min=MIN_SIDE_SAMPLE)
    speed = median(lambda p: p.multikill_span_ms / 1000 if p.multikill_span_ms is not None else None)
    for player in cohorts.players():
        rounds = facts.of_player(FactKind.PLAYER_ROUNDS, ReportCohort.SQUAD, player.name)
        cells = {f"k{size}": fixed(sum(1 for p in rounds if p.kills == size), len(rounds)) for size in MULTI_KILL_SIZES}
        cells["speed"] = facts.cell(FactKind.PLAYER_ROUNDS, speed, player)
        table.row(player.name, player.name, cells, art=player_art(player))
    return table.build()


def _victim_buys(cohorts: ReportCohorts) -> dict[tuple[str, int, str], BuyType]:
    """Buy of the victim's team of every kill, read on the killer's round (its `opp_buy`), any cohort."""
    buys: dict[tuple[str, int, str], BuyType] = {}
    for cohort in ReportCohort:
        for r in cohorts.indexes[cohort].all(FactKind.ROUNDS):
            buys[(r.match_id, r.round_index, r.team_id)] = r.opp_buy
    return buys


def _kill_value(cohorts: ReportCohorts, facts: PlayerFacts) -> StatTable:
    table = TableBuilder(
        "combat-kill-value",
        "Valeur des kills par joueur",
        "Joueur",
        help="killValue",
        note="Kills hors pistols. Référence top ranked : joueurs du même rôle.",
    )
    for _, key, label, better in KILL_VALUE_BUYS:
        table.column(key, label, better=better, help="killValue", min=MIN_PLAYER_DEATHS)
    buys = _victim_buys(cohorts)

    def victim_buy(k: KillFact) -> BuyType | None:
        return buys.get((k.match_id, k.round_index, k.killer_team))

    def not_pistol(k: KillFact) -> bool:
        return victim_buy(k) not in (None, BuyType.PISTOL)

    metrics = {key: ratio(_buy_is(victim_buy, buy), not_pistol) for buy, key, _, _ in KILL_VALUE_BUYS}
    for player in cohorts.players():
        cells = {key: facts.cell(FactKind.KILLS, metric, player) for key, metric in metrics.items()}
        table.row(player.name, player.name, cells, art=player_art(player))
    return table.build()


def _buy_is(victim_buy: Callable[[KillFact], BuyType | None], buy: BuyType) -> Callable[[KillFact], bool]:
    return lambda k: victim_buy(k) is buy


def _face_to_face(cohorts: ReportCohorts) -> StatTable:
    table = TableBuilder("combat-face-to-face", "Face-à-face les plus fréquents", "Joueur", help="faceToFace")
    for i in range(1, FACE_TO_FACE_OPPONENTS + 1):
        table.column(f"o{i}", f"Adversaire {i}", ValueFormat.TEXT, 0, help="faceToFace", min=0, ref=Reference.NONE)
    kills = [k for k in cohorts.squad(FactKind.KILLS) if k.victim_cohort is Cohort.OPPONENT]
    deaths = [k for k in cohorts.squad(FactKind.DEATHS) if k.killer_cohort is KillerCohort.OPPONENT]
    for player in cohorts.players():
        won = Counter(k.victim for k in kills if k.killer == player.name)
        lost = Counter(k.killer for k in deaths if k.victim == player.name)
        met = sorted(set(won) | set(lost), key=lambda o: (-(won[o] + lost[o]), o.lower()))[:FACE_TO_FACE_OPPONENTS]
        cells = {f"o{i}": fixed(f"{o.strip()} {won[o]}-{lost[o]}", won[o] + lost[o]) for i, o in enumerate(met, 1)}
        table.row(player.name, player.name, cells, art=player_art(player))
    return table.build()


def _by_map(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("combat-maps", "Combat par carte", "Carte", help="acs")
        .column("acs", "ACS", ValueFormat.DECIMAL_1, help="acs", min=MIN_PLAYER_ROUNDS)
        .column("kd", "K/D", ValueFormat.DECIMAL_2, help="kd", min=MIN_PLAYER_ROUNDS)
        .column("adr", "ADR", ValueFormat.DECIMAL_1, help="adr", min=MIN_PLAYER_ROUNDS)
        .column("kast", "KAST", help="kast", min=MIN_PLAYER_ROUNDS)
        .column("hs", "HS %", help="headshotRate", min=MIN_PLAYER_ROUNDS)
        .column("zero", "Morts à 0 dégât", better=-1, help="zeroDamageDeaths", min=MIN_PLAYER_DEATHS)
    )

    def cells(**equal: Any) -> dict[str, StatCell]:
        def team(metric: Callable[[Sequence[PlayerRoundFact]], tuple[float | None, int]]) -> StatCell:
            return cell(cohorts, FactKind.PLAYER_ROUNDS, metric, **equal)

        return {
            "acs": team(sum_ratio(lambda p: p.score)),
            "kd": team(sum_ratio(lambda p: p.kills, lambda p: p.deaths)),
            "adr": team(sum_ratio(lambda p: p.damage)),
            "kast": team(ratio(lambda p: p.kast)),
            "hs": team(sum_ratio(lambda p: p.headshots, _hits)),
            "zero": team(ratio(lambda p: p.zero_damage_death, _died)),
        }

    for map_name in cohorts.maps():
        table.row(map_name, map_name, cells(map_name=map_name), art=map_art(map_name))
    table.row("all", "Toutes les cartes", cells(), total=True)
    return table.build()
