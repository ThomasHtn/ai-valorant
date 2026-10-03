import { CellTone } from '@core/report/tone.model';

/** Utility class painting a cell of each colour (defined in `styles.css`). */
export const TONE_CLASSES: Record<CellTone, string> = {
  good: 'tone-good',
  avg: 'tone-avg',
  bad: 'tone-bad',
  small: 'tone-small',
};

/** Hover delay before a cell tip opens, so sweeping the mouse over a table stays quiet. */
export const CELL_TIP_DELAY_MS = 120;
