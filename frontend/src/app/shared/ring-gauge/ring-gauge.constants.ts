/** Ring radius giving a circumference of 100, so a share in percent is the arc's dash length. */
export const RING_RADIUS = 100 / (2 * Math.PI);

/** Stroke colour of the arc per tone; neutral when the figure is not judged. */
export const RING_TONE_STROKES: Record<string, string> = {
  good: 'stroke-rating-good',
  avg: 'stroke-rating-average',
  bad: 'stroke-accent-red',
  small: 'stroke-text-muted',
  none: 'stroke-text-secondary',
};

/** Colour of the value in the middle per tone. */
export const RING_TONE_TEXTS: Record<string, string> = {
  good: 'text-rating-good',
  avg: 'text-rating-average',
  bad: 'text-accent-red',
  small: 'text-text-muted',
  none: 'text-text-primary',
};
