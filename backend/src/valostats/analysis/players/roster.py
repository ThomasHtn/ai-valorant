"""One line per squad player: the headline numbers of the period."""

from collections import defaultdict
from collections.abc import Collection, Sequence

from valostats.analysis.players.breakdowns import kill_death_ratio
from valostats.analysis.players.metrics import StatAccumulator
from valostats.domain.facts import PlayerRoundFact
from valostats.schemas.period.player import RosterRow


def roster(squad_rows: Sequence[PlayerRoundFact], with_profile: Collection[str] = ()) -> list[RosterRow]:
    """Most rounds played first; `with_profile` lists the puuids that have a profile page."""
    by_player: defaultdict[str, list[PlayerRoundFact]] = defaultdict(list)
    for r in squad_rows:
        by_player[r.puuid].append(r)
    rows = []
    for puuid, rs in sorted(by_player.items(), key=lambda kv: -len(kv[1])):
        acc = StatAccumulator(rs)
        rows.append(
            RosterRow(
                puuid=puuid,
                name=rs[-1].name,
                has_profile=puuid in with_profile,
                matches=len({r.match_id for r in rs}),
                acs=acc.mean("acs"),
                kd=kill_death_ratio(rs),
                adr=acc.mean("adr"),
                kast=acc.mean("kast"),
                headshots=acc.mean("hs"),
                first_bloods=sum(r.first_blood for r in rs),
                first_deaths=sum(r.first_death for r in rs),
                opening=acc.mean("opening"),
                traded=acc.mean("traded"),
                impact=acc.mean("impact"),
            )
        )
    return rows
