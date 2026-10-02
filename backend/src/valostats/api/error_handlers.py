"""HTTP rendering of domain errors."""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from valostats.core.errors import NotFoundError


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(NotFoundError)
    async def not_found(_: Request, error: NotFoundError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"detail": str(error)})
