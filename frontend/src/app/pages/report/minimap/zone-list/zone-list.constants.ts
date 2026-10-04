/** Round chips per player in a zone; the rest is counted ('+3'). */
export const MAX_ROUNDS_PER_PLAYER = 6;

/** A zone is flagged when the squad's first-death share beats the top ranked's by this much (rate points)... */
export const ZONE_EXCESS_ALERT = 0.05;
/** ...on at least this many first deaths, so one unlucky death does not paint a zone red. */
export const ZONE_MIN_FIRST_DEATHS = 3;
/** Below this many first deaths on a side, the zones are not compared with the top ranked at all. */
export const ZONE_MIN_SIDE_FIRST_DEATHS = 10;
/** Under this top ranked share, a zone where the squad never died first is not compared (0 % against 1 %). */
export const ZONE_MIN_TOP_SHARE = 0.02;
/** Zones named in the verdict. */
export const VERDICT_ZONES = 3;

/** Round chip of a zone: red for the player's first death, grey for a later death. */
const ROUND_CHIP = 'px-1.5 text-sm leading-6 font-semibold no-underline transition-colors';
export const ROUND_CHIP_CLASSES = {
  first: `${ROUND_CHIP} bg-rating-bad/30 !text-text-primary hover:bg-rating-bad/50`,
  other: `${ROUND_CHIP} bg-text-primary/8 !text-text-secondary hover:bg-text-primary/16 hover:!text-text-primary`,
} as const;

/** Fill of a zone bar: red where the squad dies first clearly more often than the top ranked. */
export const ZONE_BAR_CLASSES = {
  over: 'bg-rating-bad',
  under: 'bg-text-secondary/55',
  even: 'bg-text-secondary/55',
} as const;
