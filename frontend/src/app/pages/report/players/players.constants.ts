/** Minimum sample of the opening duel tiles (duels, rounds after a first blood or a first death). */
export const PANEL_MIN_SAMPLE = 15;

/** Minimum number of clutches of one size before the bar is coloured. */
export const CLUTCH_MIN_SAMPLE = 10;

/** Round links shown per death zone before the "+N" count. */
export const ZONE_ROUND_LINKS = 5;

/** A death zone is flagged when the player dies there this many times more often than top ranked of his role... */
export const ZONE_HIGH_RATIO = 1.3;

/** ...and with at least this many deaths, so one unlucky round never flags a zone. */
export const ZONE_MIN_DEATHS = 5;
