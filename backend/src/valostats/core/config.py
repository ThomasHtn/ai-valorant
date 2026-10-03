"""Application settings, read from environment variables or `backend/.env`."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")

    # ValoStats database (docker-compose.yml at the repository root).
    database_url: str = "postgresql+psycopg://valostats:valostats@localhost:5433/valostats"
    # ValoQuests database, read only: active squad players and their competitive matches.
    valoquests_database_url: str = ""
    henrik_api_key: str = ""
    # Origins allowed to call the API from a browser (ValoQuests front end, for example).
    cors_origins: list[str] = ["http://localhost:4200"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
