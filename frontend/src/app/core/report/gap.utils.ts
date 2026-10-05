import { UNIT_SPACE } from '@core/format/value-format.utils';

import { wilsonInterval } from './confidence-interval.utils';
import {
  GAP_MIN_SAMPLE,
  GAP_TONE_Z,
  STRONG_MAP_GAP,
  VERDICT_MIN_MATCHES,
  VERDICT_SOLID_ROUNDS,
  VERDICT_WORK_ROUNDS,
} from './gap.constants';
import { Gap } from './squad.model';
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
 * Colour of a gap: grey on a thin sample, orange while the top ranked rate sits inside the squad's
 * 90 % Wilson interval (the gap may be chance), green or red once it is outside.
 */
export function gapTone(gap: Gap): CellTone {
  const rate = gapRate(gap);
  if (isThin(gap) || rate === null || gap.top === null) {
    return 'small';
  }
  const interval = wilsonInterval(rate, gap.n, GAP_TONE_Z);
  if (!interval || (gap.top >= interval.low && gap.top <= interval.high)) {
    return 'avg';
  }
  return rate > gap.top ? 'good' : 'bad';
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

/** Rounds per match of a gap, to one decimal. */
export function perMatch(rounds: number | null, matches: number): number | null {
  return rounds === null || !matches ? null : Math.round((rounds / matches) * 10) / 10;
}

/** Costliest first, thin samples last. */
export function byCost<T>(items: readonly T[], gapOf: (item: T) => Gap): T[] {
  return [...items].sort(
    (a, b) =>
      Number(isThin(gapOf(a))) - Number(isThin(gapOf(b))) ||
      (gapOf(a).rounds ?? 0) - (gapOf(b).rounds ?? 0),
  );
}

/** Tone of one cell of the per-map strip: strong red from a 2-round loss. */
export type StripTone = 'strong-bad' | 'bad' | 'good' | 'even' | 'none';

export function stripTone(gap: Gap): StripTone {
  if (isThin(gap) || gap.rounds === null) {
    return 'none';
  }
  if (gap.rounds <= -STRONG_MAP_GAP) {
    return 'strong-bad';
  }
  if (gap.rounds <= -0.5) {
    return 'bad';
  }
  return gap.rounds >= 0.5 ? 'good' : 'even';
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
