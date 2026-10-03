/** Number of rounds linked per zone, and of players named. */
export const MAX_REFS = 6;
export const MAX_PLAYERS = 3;

/** A zone is flagged when the squad's first-death share beats the top ranked's by this much (rate points)... */
export const ZONE_EXCESS_ALERT = 0.05;
/** ...on at least this many first deaths, so one unlucky death does not paint a zone red. */
export const ZONE_MIN_FIRST_DEATHS = 3;
