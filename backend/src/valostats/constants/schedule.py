"""Collection schedule of the production scheduler (`valostats schedule`)."""

# UTC hour of the nightly collection, once the evening's 5-stacks are over (6 h in Paris in summer).
COLLECTION_HOUR_UTC = 4
# Day of the weekly top ranked collection (Monday), run right after the squad sync.
TOP_COLLECTION_WEEKDAY = 0
