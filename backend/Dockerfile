# syntax=docker/dockerfile:1

# ---- Build stage ------------------------------------------------------------
# Builds the virtual environment. Quality gates (ruff, mypy, pytest) run before an image is built,
# so this stage only installs the project.
FROM python:3.12-slim AS build
COPY --from=ghcr.io/astral-sh/uv:0.12.1 /uv /bin/uv
WORKDIR /app

# Use the image's Python in both stages; copy instead of hardlinking from the uv cache.
ENV UV_PYTHON_DOWNLOADS=0 UV_LINK_MODE=copy UV_COMPILE_BYTECODE=1

# Dependencies first, so this layer is only rebuilt when the lock file changes.
COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-dev --no-install-project --no-editable

COPY src src
RUN uv sync --locked --no-dev --no-editable

# ---- Runtime stage ----------------------------------------------------------
FROM python:3.12-slim AS runtime
WORKDIR /app

RUN groupadd --system valostats && useradd --system --gid valostats valostats
USER valostats

COPY --from=build /app/.venv /app/.venv
COPY alembic.ini ./
COPY migrations migrations
ENV PATH="/app/.venv/bin:$PATH" PYTHONUNBUFFERED=1

EXPOSE 8000

# Migrations run before every start, like Flyway on ValoQuests. Collection jobs reuse this image:
# `docker compose run --rm backend valostats sync`.
CMD ["sh", "-c", "alembic upgrade head && exec uvicorn valostats.main:app --host 0.0.0.0 --port 8000"]
