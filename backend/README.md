# Backend

API FastAPI et collecte des données. Organisation du code : `../docs/ARCHITECTURE.md`.

```bash
uv sync                                          # dépendances
uv run alembic upgrade head                      # schéma
uv run valostats --help                          # collecte : sync, sync-top, sync-maps, rebuild-facts, import-legacy, top-status
uv run uvicorn valostats.main:app --reload       # API sur :8000, doc sur /docs
uv run pytest                                    # tests (les tests `integration` utilisent la base locale)
uv run ruff check src tests && uv run mypy       # lint et typage strict
```

La configuration vient de `.env` (modèle : `.env.example`).
