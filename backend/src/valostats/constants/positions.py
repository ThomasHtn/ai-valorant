"""Numbers of the "Positions" tables: zones, engagement distances."""

# A zone is listed once the squad made or suffered this many kills there (map and side).
MIN_ZONE_EVENTS = 5
# Sample (kills plus deaths in the zone) before the K/D of a zone is coloured.
MIN_ZONE_SAMPLE = 10
# Engagement distance bands, in metres: short under the first, long from the second.
SHORT_RANGE_M = 10
LONG_RANGE_M = 25
# Opponent zones listed per map and side in the contact table.
CONTACT_ZONES = 3
