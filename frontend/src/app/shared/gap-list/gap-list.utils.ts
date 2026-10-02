import { Noun, Rate } from '@core/common/common.model';
import { agree } from '@core/format/format.utils';
import { Rating } from '@core/rating/rating.model';

import { GAP_MIN_TRIES, ROUND_NOUN } from './gap-list.constants';
import { GapLine, GapRow } from './gap-list.model';

/** Successes above (or below) what the reference rate would give on the same number of tries. */
export function gapToReference(squad: Rate, reference: Rate | null): number {
  const value = reference?.value;
  return value === null || value === undefined ? 0 : squad.count - value * squad.total;
}

/** '-5 rounds', '+1 round' or '=' once rounded. */
export function gapLabel(gap: number, unit: Noun = ROUND_NOUN): string {
  const rounded = Math.round(gap);
  if (rounded === 0) {
    return '=';
  }
  return `${rounded > 0 ? '+' : ''}${rounded} ${agree(unit, Math.abs(rounded))}`;
}

/** Colour from the gap in whole units, so the colour and the written gap always agree. */
export function gapRating(gap: number): Rating {
  const rounded = Math.round(gap);
  if (rounded === 0) {
    return 'average';
  }
  return rounded > 0 ? 'good' : 'bad';
}

export function gapRow(line: GapLine): GapRow {
  const gap = gapToReference(line.squad, line.reference);
  const muted = line.squad.total < GAP_MIN_TRIES || !line.reference?.total;
  return { ...line, gap, rating: muted ? 'unknown' : gapRating(gap), muted };
}

/** Lines that were played, the costliest first; lines too small to read come last. */
export function gapRows(lines: GapLine[]): GapRow[] {
  return lines
    .filter((line) => line.squad.total)
    .map(gapRow)
    .sort((a, b) => Number(a.muted) - Number(b.muted) || a.gap - b.gap);
}
