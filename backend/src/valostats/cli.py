"""Command line: data collection and maintenance. Run `uv run valostats --help`."""

import logging
from typing import Annotated

import typer

from valostats.clients.henrik_client import HenrikClient
from valostats.clients.valoquests_client import ValoQuestsClient
from valostats.constants.henrik import SQUAD_REQUEST_DELAY_S, TOP_REQUEST_DELAY_S
from valostats.core.config import get_settings
from valostats.core.database import get_session_factory
from valostats.domain.enums import MatchSource
from valostats.ingestion.facts_rebuild import rebuild_facts
from valostats.ingestion.maps_sync import sync_maps
from valostats.ingestion.schedule import run_forever
from valostats.ingestion.squad_sync import sync_squad
from valostats.ingestion.top_sync import sync_top
from valostats.repositories import match_repository
from valostats.services.snapshot_refresh import refresh_snapshots

app = typer.Typer(help="ValoStats data collection.", no_args_is_help=True)


@app.callback()
def configure_logging() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


@app.command("sync")
def sync_command() -> None:
    """Squad and 5-stacks from ValoQuests, missing match details from Henrik, then facts rebuild."""
    settings = get_settings()
    with get_session_factory()() as session:
        sync_squad(
            session, ValoQuestsClient(settings.valoquests_database_url), HenrikClient(settings.henrik_api_key, SQUAD_REQUEST_DELAY_S)
        )
    refresh_snapshots(get_session_factory())


@app.command("sync-top")
def sync_top_command() -> None:
    """Top ranked matches of the last 7 days (about 1 h 30, uses most of the shared Henrik quota)."""
    with get_session_factory()() as session:
        sync_top(session, HenrikClient(get_settings().henrik_api_key, TOP_REQUEST_DELAY_S))
    refresh_snapshots(get_session_factory())


@app.command("sync-maps")
def sync_maps_command() -> None:
    """Refresh map metadata from valorant-api.com (after a new map release)."""
    with get_session_factory()() as session:
        sync_maps(session)
    refresh_snapshots(get_session_factory())


@app.command("rebuild-facts")
def rebuild_facts_command(source: Annotated[MatchSource | None, typer.Argument(help="squad or top; both when omitted")] = None) -> None:
    """Recompute the fact tables from the stored raw matches."""
    with get_session_factory()() as session:
        for s in [source] if source else list(MatchSource):
            rebuild_facts(session, s)
    refresh_snapshots(get_session_factory())


@app.command("snapshots")
def snapshots_command() -> None:
    """Precompute the report views of every period missing for the current facts and code."""
    refresh_snapshots(get_session_factory())


@app.command("schedule")
def schedule_command() -> None:
    """Production scheduler: `sync` every night at 4 h UTC, `sync-top` on Mondays. Runs until stopped."""
    # After a deploy the stored views belong to the previous code: recompute them before waiting.
    run_forever(startup=snapshots_command, nightly=sync_command, weekly=sync_top_command)


@app.command("top-status")
def top_status_command() -> None:
    """Top ranked volume per patch and map."""
    with get_session_factory()() as session:
        for patch, map_name, n in match_repository.count_by_patch_and_map(session, MatchSource.TOP):
            typer.echo(f"patch {patch}  {map_name:<10} {n}")


if __name__ == "__main__":
    app()
