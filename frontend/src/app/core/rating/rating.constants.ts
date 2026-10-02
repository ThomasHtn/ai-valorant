import { Rating, RatingThresholds } from './rating.model';

/**
 * Fixed benchmarks of the individual stats, matching the "Repère" lines of the explanations
 * (`core/help`). Rates are shares between 0 and 1, the impact is in points per round.
 */
export const STAT_THRESHOLDS = {
  acs: { bad: 180, good: 230 },
  adr: { bad: 125, good: 155 },
  kd: { bad: 0.9, good: 1.1 },
  kast: { bad: 0.65, good: 0.73 },
  hs: { bad: 0.17, good: 0.25 },
  opening: { bad: 0.45, good: 0.55 },
  impact: { bad: -1, good: 1 },
  /** Any share of rounds won where 50 % is par: rounds, sides, pistols, first bloods. */
  winRate: { bad: 0.45, good: 0.55 },
} satisfies Record<string, RatingThresholds>;

export type RatedStat = keyof typeof STAT_THRESHOLDS;

/** A rate this close to its reference (3 points) reads as average rather than better or worse. */
export const REFERENCE_AVERAGE_BAND = 0.03;

/** Same band for a mean, relative to the reference (5 %). */
export const REFERENCE_AVERAGE_SHARE = 0.05;

/** Text colour of each rating; full literals so Tailwind finds them. */
export const RATING_TEXT_CLASS: Record<Rating, string> = {
  good: 'text-rating-good',
  average: 'text-rating-average',
  bad: 'text-rating-bad',
  unknown: 'text-text-primary',
};

/** Fill of a bar or a mark carrying the same reading. */
export const RATING_FILL_CLASS: Record<Rating, string> = {
  good: 'bg-rating-good',
  average: 'bg-rating-average',
  bad: 'bg-rating-bad',
  unknown: 'bg-text-secondary',
};

/** Token behind each rating, for inline styles and canvases. */
export const RATING_COLOR_VARIABLE: Record<Rating, string> = {
  good: '--color-rating-good',
  average: '--color-rating-average',
  bad: '--color-rating-bad',
  unknown: '--color-text-secondary',
};
