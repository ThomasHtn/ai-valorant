import { CellTone } from '@core/report/tone.model';

/** Fill of a bar per tone; the squad blue when not judged. */
export const BAR_FILLS: Record<CellTone | 'none', string> = {
  good: 'bg-rating-good',
  avg: 'bg-rating-average',
  bad: 'bg-rating-bad',
  small: 'bg-text-muted',
  none: 'bg-squad',
};

/** Ten segments, like a game attribute gauge: the gaps are cut out of the bar. */
export const BAR_SEGMENTS_MASK =
  'repeating-linear-gradient(90deg, #000 0 calc(10% - 3px), transparent calc(10% - 3px) 10%)';
