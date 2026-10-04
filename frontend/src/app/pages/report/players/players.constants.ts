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

/** Plural role names, to name a player's reference ('les initiateurs des équipes affrontées'). */
export const ROLE_PLURALS: Readonly<Record<string, string>> = {
  Duelist: 'duellistes',
  Initiator: 'initiateurs',
  Controller: 'contrôleurs',
  Sentinel: 'sentinelles',
};

/** Strengths and weaknesses listed under the player card. */
export const VERDICT_ITEMS = 3;

/** A block sharing its row: no frame of its own, its rows carry the ground; notes sink to the bottom. */
export const PANEL_CLASS = 'flex min-w-0 flex-col gap-3';
