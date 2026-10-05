# Common commands; run `make <target>` from the repository root.

.PHONY: db migrate sync sync-top api front test lint

db:        ## Start PostgreSQL (port 5433)
	docker compose up -d

migrate:   ## Apply database migrations
	cd backend && uv run alembic upgrade head

sync:      ## Squad 5-stacks from ValoQuests and Henrik, then facts rebuild
	cd backend && uv run valostats sync

sync-top:  ## Top ranked matches of the current patch, up to the per-map quotas
	cd backend && uv run valostats sync-top

api:       ## API on http://localhost:8000 (docs on /docs)
	cd backend && uv run uvicorn valostats.main:app --reload

front:     ## Front end on http://localhost:4200
	cd frontend && npm start

test:      ## Every test suite
	cd backend && uv run pytest
	cd frontend && npm test -- --watch=false

lint:      ## Linters, formatters and type checks
	cd backend && uv run ruff check src tests && uv run ruff format --check src tests && uv run mypy
	cd frontend && npm run format:check
