from datetime import UTC, datetime

from valostats.ingestion.schedule import next_run


def test_next_run_is_later_today_before_the_collection_hour():
    assert next_run(datetime(2026, 10, 3, 1, 30, tzinfo=UTC)) == datetime(2026, 10, 3, 4, tzinfo=UTC)


def test_next_run_is_tomorrow_at_or_after_the_collection_hour():
    assert next_run(datetime(2026, 10, 3, 4, tzinfo=UTC)) == datetime(2026, 10, 4, 4, tzinfo=UTC)
    assert next_run(datetime(2026, 10, 3, 22, tzinfo=UTC)) == datetime(2026, 10, 4, 4, tzinfo=UTC)


def test_next_run_crosses_the_month():
    assert next_run(datetime(2026, 10, 31, 5, tzinfo=UTC)) == datetime(2026, 11, 1, 4, tzinfo=UTC)
