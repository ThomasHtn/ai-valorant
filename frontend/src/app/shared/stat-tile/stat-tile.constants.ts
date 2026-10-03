import { CellTone } from '@core/report/tone.model';

/** Text colour of a figure per tone (tiles, bars, form tiles); grey under the minimum sample. */
export const TONE_TEXT_CLASSES: Record<CellTone, string> = {
  good: 'text-rating-good',
  avg: 'text-rating-average',
  bad: 'text-rating-bad',
  small: 'text-text-muted',
};
