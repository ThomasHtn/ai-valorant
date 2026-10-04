import { shortDay } from '@core/format/format.utils';
import { FormMatch } from '@core/report/period-form.model';

import {
  FORM_STRIP_FULL_MARGIN,
  FORM_STRIP_MAX_MATCHES,
  FORM_STRIP_MIN_HEIGHT,
} from './form-strip.constants';
import { FormBar } from './form-strip.model';

/** Bars of the latest matches, a bigger margin drawing a taller bar. */
export function formBars(matches: readonly FormMatch[]): FormBar[] {
  return matches.slice(-FORM_STRIP_MAX_MATCHES).map((m) => {
    const share = Math.min(Math.abs(m.margin) / FORM_STRIP_FULL_MARGIN, 1);
    return {
      result: m.margin > 0 ? 'win' : m.margin < 0 ? 'loss' : 'draw',
      height: FORM_STRIP_MIN_HEIGHT + share * (1 - FORM_STRIP_MIN_HEIGHT),
      tip: { title: m.map, lines: [{ label: 'Score', value: m.score }], note: shortDay(m.day) },
    };
  });
}
