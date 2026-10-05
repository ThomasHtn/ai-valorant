import { UNIT_SPACE } from '@core/format/value-format.utils';

import {
  GAP_MIN_SAMPLE,
  VERDICT_MIN_MATCHES,
  VERDICT_SOLID_ROUNDS,
  VERDICT_WORK_ROUNDS,
} from './gap.constants';
import { Gap } from './squad.model';
import { RATE_AVERAGE_BAND } from './tone.constants';
import { CellTone } from './tone.model';

const SIGNED = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

/** Squad rate of a gap, null without sample. */
export function gapRate(gap: Gap): number | null {
  return gap.n ? gap.k / gap.n : null;
}

/** True when the sample is too small to read: the line is greyed and sorted last. */
export function isThin(gap: Gap): boolean {
  return gap.n < GAP_MIN_SAMPLE || gap.top === null;
}

/**
 * Colour of a gap, the way it is written: grey on a thin sample, orange within 3 points of the top
 * ranked rate, then green or red by its sign.
 */
export function gapTone(gap: Gap): CellTone {
  const rate = gapRate(gap);
  if (isThin(gap) || rate === null || gap.top === null) {
    return 'small';
  }
  const diff = rate - gap.top;
  if (Math.abs(diff) < RATE_AVERAGE_BAND) {
    return 'avg';
  }
  return diff > 0 ? 'good' : 'bad';
}

/** '+4', '−2,5', '0': a number of rounds with a true minus sign and at most one decimal. */
export function signedRounds(value: number | null): string {
  if (value === null) {
    return '–';
  }
  const rounded = Math.round(value * 10) / 10;
  if (rounded === 0) {
    return '0';
  }
  return `${rounded > 0 ? '+' : '−'}${SIGNED.format(Math.abs(rounded))}`;
}

/** Costliest first, thin samples last. */
export function byCost<T>(items: readonly T[], gapOf: (item: T) => Gap): T[] {
  return [...items].sort(
    (a, b) =>
      Number(isThin(gapOf(a))) - Number(isThin(gapOf(b))) ||
      (gapOf(a).rounds ?? 0) - (gapOf(b).rounds ?? 0),
  );
}

/** Where to invest practice on a map: never a pick or a ban, the squad plays ranked. */
export type MapVerdict = 'solid' | 'stabilize' | 'work' | 'test';

export function mapVerdict(rounds: number | null, matches: number): MapVerdict {
  if (matches < VERDICT_MIN_MATCHES || rounds === null) {
    return 'test';
  }
  if (rounds >= VERDICT_SOLID_ROUNDS) {
    return 'solid';
  }
  return rounds <= VERDICT_WORK_ROUNDS ? 'work' : 'stabilize';
}

/** Sum of two gaps in rounds, unknown when either is. */
export function addRounds(a: number | null, b: number | null): number | null {
  return a === null || b === null ? null : Math.round((a + b) * 10) / 10;
}

/** 'k sur n' as written under a rate. */
export function volume(gap: Gap): string {
  return `${gap.k}${UNIT_SPACE}sur${UNIT_SPACE}${gap.n}`;
}
