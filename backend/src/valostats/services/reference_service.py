"""Reference data: squad, maps and the state of the collected data."""

from sqlalchemy.orm import Session

from valostats.domain.enums import MatchSource
from valostats.repositories import facts_repository, map_repository, match_repository, squad_repository
from valostats.schemas.reference import DataStatus, GameMapDto, SourceStatus, SquadPlayerDto


def squad_players(session: Session) -> list[SquadPlayerDto]:
    return [SquadPlayerDto(puuid=p.puuid, name=p.name) for p in squad_repository.list_active(session)]


def game_maps(session: Session) -> list[GameMapDto]:
    return [
        GameMapDto(name=m.name, minimap_url=m.minimap_url) for m in sorted(map_repository.load_all(session).values(), key=lambda m: m.name)
    ]


def data_status(session: Session) -> DataStatus:
    sources = []
    for source in MatchSource:
        build = facts_repository.latest_build(session, source)
        sources.append(
            SourceStatus(
                source=source.value,
                matches=build.matches if build else 0,
                latest_match=match_repository.latest_started_at(session, source),
                facts_built_at=build.built_at if build else None,
            )
        )
    return DataStatus(sources=sources)
