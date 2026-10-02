"""Squad scoreboard of a match, and each player's evening against their usual level."""

from collections.abc import Sequence

from valostats.analysis.players.metrics import StatAccumulator
from valostats.domain.facts import PlayerRoundFact
from valostats.schemas.period.player import HeadlineValue
from valostats.schemas.session import ScoreboardRow, VersusUsualRow


def _by_score(rows: Sequence[PlayerRoundFact]) -> list[str]:
    """Player names, best total score first."""
    names = {r.name for r in rows}
    return sorted(names, key=lambda n: -sum(r.score for r in rows if r.name == n))


def scoreboard(rows: Sequence[PlayerRoundFact]) -> list[ScoreboardRow]:
    out = []
    for name in _by_score(rows):
        rs = [r for r in rows if r.name == name]
        acc = StatAccumulator(rs)
        out.append(
            ScoreboardRow(
                name=name,
                agent=rs[0].agent,
                kills=sum(r.kills for r in rs),
                deaths=sum(r.deaths for r in rs),
                assists=sum(r.assists for r in rs),
                acs=acc.mean("acs"),
                adr=acc.mean("adr"),
                kast=acc.mean("kast"),
                first_bloods=sum(r.first_blood for r in rs),
                first_deaths=sum(r.first_death for r in rs),
                impact=acc.mean("impact"),
            )
        )
    return out


def versus_usual(evening: Sequence[PlayerRoundFact], usual: Sequence[PlayerRoundFact]) -> list[VersusUsualRow]:
    out = []
    for name in _by_score(evening):
        now = StatAccumulator(r for r in evening if r.name == name)
        before = StatAccumulator(r for r in usual if r.name == name)

        def value(key: str, now: StatAccumulator = now, before: StatAccumulator = before) -> HeadlineValue:
            return HeadlineValue(value=now.mean(key), previous=before.mean(key))

        out.append(VersusUsualRow(name=name, acs=value("acs"), adr=value("adr"), kast=value("kast"), impact=value("impact")))
    return out
