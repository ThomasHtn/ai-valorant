/** How a figure reads for the squad: good (green), average (amber), bad (red), or not judged. */
export type Rating = 'good' | 'average' | 'bad' | 'unknown';

/** Below `bad` is bad, from `good` up is good, in between is average; flipped when lower is better. */
export interface RatingThresholds {
  bad: number;
  good: number;
  higherIsBetter?: boolean;
}
