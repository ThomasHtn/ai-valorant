# ValoStats: Backend

FastAPI service that collects the squad's ranked 5-stacks and the top ranked matches, turns them into
fact tables, and serves every report view as JSON under `/api`. The [front end](../frontend/README.md)
only displays what it returns.

| | |
|---|---|
| Language | Python 3.12, typed (`mypy --strict`) |
| API | FastAPI, Pydantic DTOs in camelCase, served by uvicorn |
| Database | PostgreSQL 17, SQLAlchemy 2, Alembic migrations |
| Collection | `httpx` for HenrikDev and valorant-api.com, Typer for the CLI |
| Tooling | uv, Ruff (lint and format), pytest |

## Getting started

Requirements: [uv](https://docs.astral.sh/uv/) and Docker. From the repository root:

```bash
cp backend/.env.example backend/.env    # fill VALOQUESTS_DATABASE_URL and HENRIK_API_KEY
make db                                 # PostgreSQL 17 on localhost:5433
cd backend
uv sync
uv run alembic upgrade head
uv run valostats sync                   # first collection, then facts rebuild
uv run uvicorn valostats.main:app --reload
```

The API listens on `http://localhost:8000`, with the interactive documentation on `/docs`.

## Commands

```bash
uv run pytest                                    # unit and API suites
uv run pytest -m integration                     # every endpoint against the local database
uv run pytest tests/unit/test_domain_combat.py   # a single file
uv run ruff check src tests && uv run ruff format --check src tests
uv run mypy
uv run alembic revision --autogenerate -m "..."  # new migration after a model change
```

`make test` and `make lint` at the root run the same gates for both sides.

## Collection

| Command | When | What it does |
|---|---|---|
| `valostats sync` | After each evening | Squad and 5-stacks from ValoQuests, missing match details from Henrik, then facts rebuild and report views only if something new arrived |
| `valostats sync-top` | Once a week | Top 20 of each region, matches of the last 7 days (about 1 h 30) |
| `valostats sync-maps` | After a new map | Map metadata (callouts, minimaps) from valorant-api.com, then facts rebuild and report views |
| `valostats rebuild-facts [squad\|top]` | After an extraction change | Recomputes the fact tables from the stored raw matches, then the report views |
| `valostats snapshots` | After a deploy (the scheduler does it at start) | Precomputes the report views of every home period missing for the current facts and code (about 15 min) |
| `valostats top-status` | Any time | Top ranked volume per patch and map |
| `valostats schedule` | Production | Runs `sync` every night and `sync-top` on Mondays, until stopped |

The Henrik key is shared with ValoQuests (30 requests per minute), so `sync-top` waits between requests.
After each rebuild, the running API notices the new build and reloads its facts by itself.

## Configuration

Read from environment variables, or from `backend/.env` in development (`core/config.py`).

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | ValoStats database (`postgresql+psycopg://...`) |
| `VALOQUESTS_DATABASE_URL` | ValoQuests database, read only: active players and their competitive matches |
| `HENRIK_API_KEY` | HenrikDev API key |
| `CORS_ORIGINS` | Browser origins allowed to call the API from another site (JSON list) |

## Structure

```
src/valostats/
├── api/            thin FastAPI routes, error handlers
├── analysis/
│   ├── extraction/ raw Henrik payload -> facts, one module per fact type
│   ├── report/     pure functions: facts of a period -> report DTOs
│   └── statistics/ proportion tests, Benjamini-Hochberg
├── clients/        Henrik, ValoQuests (read only), valorant-api
├── constants/      game rules and thresholds, one file per topic
├── core/           settings, database engine, errors
├── db/models/      one SQLAlchemy table per file
├── domain/         enums, immutable fact dataclasses, maps
├── ingestion/      collection and facts rebuild, called by the CLI
├── repositories/   the only place that writes SQL
├── schemas/        Pydantic DTOs, one file per report view
├── services/       facts in memory, report views stored per data version, match service
├── cli.py          Typer entry point (`valostats`)
└── main.py         FastAPI application
```

The data flow, the fact vocabulary, the comparison references and a step by step "add a stat" guide
are in [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).

Three rules hold everywhere:

- The `match` table keeps the raw Henrik JSON. It is the source of truth; every fact is rebuilt from it.
- `analysis/` never touches the database or HTTP, which keeps every stat testable with plain objects.
- The API returns numbers, never colours or formatted text.

## API

Every route is a `GET` under `/api`. A report route takes the period as query parameters: `month`
(`2026-09`), `patch` (`13.06`) or `start` and `end` (ISO dates); nothing means the latest month.

| Route | Returns |
|---|---|
| `/health` | Liveness probe |
| `/status`, `/maps`, `/squad/players` | Collection status, maps with their minimap, active squad |
| `/report/periods`, `/report/meta` | Home tree (months, evenings, patches), header of a period |
| `/report/tables/{domain}` | Coloured tables of one domain |
| `/report/findings`, `/report/detections` | Tested strengths and weaknesses, automatic detections |
| `/report/trends`, `/report/distributions` | History of the squad, histograms against the top ranked |
| `/report/matches`, `/report/matches/{id}` | Evenings and their matches, one match in detail |
| `/report/rounds`, `/report/rounds/{id}/{n}` | Every round with its cause, one round sheet |
| `/report/minimap/{map}` | Kills, deaths and plants on one map, by side |
| `/report/players`, `/report/players/{name}` | Squad players, one player sheet |

## Docker

`Dockerfile` builds the virtual environment with uv on `python:3.12-slim` and copies it into a slim
runtime image that runs as an unprivileged user. On start, the container applies the Alembic migrations,
then launches uvicorn on port 8000. The same image runs the collection jobs:

```bash
docker build -t valostats-backend backend
docker run --rm --env-file backend/.env valostats-backend valostats --help
```

The API keeps the facts in memory once loaded: plan about 2 GB of RAM for the container.

## Deployment

Production runs on the VPS like the other apps: [`docker-compose.prod.yml`](../docker-compose.prod.yml)
at the repository root builds both images, and the shared Traefik serves them on
`https://valostats.thomashtn.dev`, with `/api/*` routed to this container. The database is a dedicated
database and role on the VPS PostgreSQL 17, reached through the `database` network.

```bash
cp .env.example .env    # production values, see the comments in the file
docker compose -f docker-compose.prod.yml up -d --build
```

Collection runs in the `scheduler` service of the same stack (`valostats schedule`): `sync` every night
at 4 h UTC, then `sync-top` on Mondays. A failed run is logged and retried the next night. To collect by
hand:

```bash
docker compose -f docker-compose.prod.yml run --rm backend valostats sync
docker compose -f docker-compose.prod.yml logs -f scheduler
```

To move the existing data to a new server, dump the local database and restore it into the new one:

```bash
docker exec valostats-postgres pg_dump -U valostats -Fc valostats > valostats.dump
pg_restore --no-owner --role=valostats -d "postgresql://valostats:<password>@<host>:5432/valostats" valostats.dump
```

---

Product overview: [root README](../README.md) · architecture: [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) ·
roadmap: [`docs/VISION.md`](../docs/VISION.md).
