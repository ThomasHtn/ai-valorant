import { CellTone } from '@core/report/tone.model';

/** Fill of the bar per tone. */
export const BAR_FILLS: Record<CellTone, string> = {
  good: 'bg-rating-good',
  avg: 'bg-rating-average',
  bad: 'bg-accent-red',
  small: 'bg-text-muted',
};

/** Colour of the value beside the bar per tone. */
export const BAR_TEXTS: Record<CellTone, string> = {
  good: 'text-rating-good',
  avg: 'text-rating-average',
  bad: 'text-accent-red',
  small: 'text-text-muted',
};
