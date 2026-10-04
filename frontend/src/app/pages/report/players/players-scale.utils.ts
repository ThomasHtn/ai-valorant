import { ValueFormat } from '@core/format/value-format.model';

import { MIN_REACH, RATE_SCALE, STAT_SCALES } from './players-scale.constants';

/**
 * Where a value sits on its figure's fixed scale, 0..1, 1 being the strong end: flipped when lower
 * is better. Null for a missing value or a figure without a scale that is not a rate.
 */
export function statReach(
  key: string,
  value: unknown,
  better: number,
  format: ValueFormat,
): number | null {
  if (typeof value !== 'number') {
    return null;
  }
  const scale = STAT_SCALES[key] ?? (format === 'pct' ? RATE_SCALE : null);
  if (!scale) {
    return null;
  }
  const share = (value - scale.min) / (scale.max - scale.min);
  const oriented = better < 0 ? 1 - share : share;
  return Math.min(1, Math.max(MIN_REACH, oriented));
}
