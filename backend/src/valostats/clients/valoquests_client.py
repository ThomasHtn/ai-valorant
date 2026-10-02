"""Read-only access to the ValoQuests database: who is in the squad and which matches they 5-stacked."""

from sqlalchemy import create_engine, text

SQUAD_QUERY = text("select riot_puuid, game_name from player where status = 'ACTIVE'")
# Competitive matches with at least five tracked players; the 5-stack check on one team happens at extraction.
SQUAD_MATCHES_QUERY = text(
    """
    select m.external_match_id
    from valorant_match m join player_match pm on pm.match_id = m.id
    where m.queue_id = 'competitive'
    group by m.external_match_id, m.started_at
    having count(*) >= 5
    order by m.started_at
    """
)


class ValoQuestsClient:
    def __init__(self, database_url: str) -> None:
        self._engine = create_engine(database_url)

    def squad(self) -> list[tuple[str, str]]:
        """(puuid, name) of every active player."""
        with self._engine.connect() as connection:
            return [(puuid, name) for puuid, name in connection.execute(SQUAD_QUERY)]

    def squad_match_ids(self) -> list[str]:
        with self._engine.connect() as connection:
            return list(connection.scalars(SQUAD_MATCHES_QUERY))
