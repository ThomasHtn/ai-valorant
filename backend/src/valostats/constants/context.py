"""Numbers of the "Contexte" tables: evening order, start hours, opponent level."""

# Start-hour buckets of a match, local time: before the first hour, between both, from the second.
PRIME_TIME_START_H = 21
PRIME_TIME_END_H = 23
# Matches started before this hour belong to the late bucket of the night before.
NIGHT_END_H = 6
# Opponents are of the same level when their average tier is within this many tiers of the squad's.
SAME_LEVEL_TIERS = 1.5
# Rank of a match in its evening from which rows are merged ("4e match et plus").
LAST_EVENING_RANK = 4
# French weekday names, Monday first (datetime.weekday order).
WEEKDAYS = ("Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche")
