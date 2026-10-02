"""Domain errors turned into HTTP responses by `api/error_handlers.py`."""


class NotFoundError(Exception):
    """The requested period, session, map or player has no data."""
