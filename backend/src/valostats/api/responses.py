"""Responses whose JSON body is already serialized (report views stored by the report service)."""

from fastapi import Response


def json_body(payload: str) -> Response:
    """Send stored JSON as is: no parsing, no second validation."""
    return Response(content=payload, media_type="application/json")
