"""Liveness probe."""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health", summary="The API is up")
def health() -> dict[str, str]:
    return {"status": "ok"}
