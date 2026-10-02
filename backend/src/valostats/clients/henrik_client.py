"""HenrikDev API client, patient with rate limits and server errors."""

import logging
import time
from typing import Any

import httpx

from valostats.constants import henrik

logger = logging.getLogger(__name__)


class HenrikClient:
    def __init__(self, api_key: str, delay_s: float) -> None:
        """`delay_s` is waited after every request to stay under the shared quota."""
        self._http = httpx.Client(
            base_url=henrik.BASE_URL,
            headers={"Authorization": api_key, "User-Agent": "valostats"},
            timeout=henrik.REQUEST_TIMEOUT_S,
        )
        self._delay_s = delay_s

    def match(self, match_id: str, region: str = henrik.SQUAD_REGION) -> dict[str, Any] | None:
        data = self._get(henrik.MATCH_PATH.format(region=region, match_id=match_id))
        return data if isinstance(data, dict) else None

    def competitive_history(self, puuid: str, region: str, size: int, start: int = 0) -> list[dict[str, Any]]:
        """Most recent competitive matches of a player, full payloads."""
        path = henrik.PLAYER_HISTORY_PATH.format(region=region, puuid=puuid)
        data = self._get(path, {"mode": "competitive", "size": size, "start": start})
        return data if isinstance(data, list) else []

    def leaderboard(self, region: str) -> dict[str, Any] | None:
        data = self._get(henrik.LEADERBOARD_PATH.format(region=region), {"size": henrik.TOP_LEADERBOARD_SIZE})
        return data if isinstance(data, dict) else None

    def _get(self, path: str, params: dict[str, Any] | None = None) -> Any:
        """The response's `data` field; None when the request is refused or keeps failing."""
        try:
            for _ in range(henrik.MAX_ATTEMPTS):
                try:
                    response = self._http.get(path, params=params)
                except httpx.TransportError:
                    time.sleep(henrik.SERVER_ERROR_WAIT_S)
                    continue
                if response.status_code == httpx.codes.TOO_MANY_REQUESTS:
                    reset = int(response.headers.get("x-ratelimit-reset", henrik.DEFAULT_RATE_LIMIT_WAIT_S))
                    time.sleep(reset + 2)
                elif response.status_code >= 500:
                    time.sleep(henrik.SERVER_ERROR_WAIT_S)
                elif response.is_error:
                    logger.warning("%s: HTTP %s, skipped", path, response.status_code)
                    return None
                else:
                    return response.json().get("data")
            return None
        finally:
            time.sleep(self._delay_s)
