"""Reference data: squad, maps, glossary, data status."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from valostats.core.database import get_session
from valostats.schemas.reference import DataStatus, GameMapDto, Glossary, SquadPlayerDto
from valostats.services import reference_service

router = APIRouter(tags=["reference"])
DbSession = Annotated[Session, Depends(get_session)]


@router.get("/squad/players", summary="Active squad members")
def squad_players(session: DbSession) -> list[SquadPlayerDto]:
    return reference_service.squad_players(session)


@router.get("/maps", summary="Maps with their minimap image")
def game_maps(session: DbSession) -> list[GameMapDto]:
    return reference_service.game_maps(session)


@router.get("/glossary", summary="Jargon and statistic definitions")
def glossary() -> Glossary:
    return reference_service.glossary()


@router.get("/status", summary="Collected matches and last facts rebuild per source")
def data_status(session: DbSession) -> DataStatus:
    return reference_service.data_status(session)
