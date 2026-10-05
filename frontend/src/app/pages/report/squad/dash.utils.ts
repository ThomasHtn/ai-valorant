import { formatGap, formatValue } from '@core/format/value-format.utils';
import { gapRate, isThin, signedRounds } from '@core/report/gap.utils';
import { Gap } from '@core/report/squad.model';

import { FLAT_ROUNDS, STRONG_ROUNDS } from './squad.constants';
import { DashTone, RoundsPill } from './squad.model';

/** Tone of a gap in rounds: grey on a thin sample, white under half a round, then by its sign. */
export function dashTone(gap: Gap): DashTone {
  if (isThin(gap) || gap.rounds === null) {
    return 'thin';
  }
  if (Math.abs(gap.rounds) < FLAT_ROUNDS) {
    return 'flat';
  }
  return gap.rounds > 0 ? 'good' : 'bad';
}

/** A gap in rounds as its pill: '−11,5' red on a strong ground. */
export function roundsPill(gap: Gap): RoundsPill {
  const tone = dashTone(gap);
  return {
    text: signedRounds(gap.rounds),
    tone,
    strong: (tone === 'good' || tone === 'bad') && Math.abs(gap.rounds ?? 0) >= STRONG_ROUNDS,
    unit: Math.abs(Math.round((gap.rounds ?? 0) * 10) / 10) >= 2 ? 'rounds' : 'round',
  };
}

/** Squad rate as written, '41 %'. */
export function rateText(gap: Gap): string {
  return formatValue(gapRate(gap), 'pct');
}

/** Squad rate minus top ranked rate in points, '−4 pts'. */
export function pointsText(gap: Gap): string {
  const rate = gapRate(gap);
  return rate === null || gap.top === null ? '–' : formatGap(rate - gap.top, 'pct');
}

/** Top ranked rate of a set of gaps, weighted by the squad's rounds in each. */
export function weightedTop(gaps: readonly Gap[]): number | null {
  const known = gaps.filter((g) => g.top !== null && g.n);
  const n = known.reduce((sum, g) => sum + g.n, 0);
  return n ? known.reduce((sum, g) => sum + g.n * (g.top ?? 0), 0) / n : null;
}

/** Several gaps added up: rounds, wins and the weighted top ranked rate. */
export function sumGaps(gaps: readonly Gap[]): Gap {
  const k = gaps.reduce((sum, g) => sum + g.k, 0);
  const n = gaps.reduce((sum, g) => sum + g.n, 0);
  const top = weightedTop(gaps);
  return {
    k,
    n,
    top,
    topN: gaps.reduce((sum, g) => sum + g.topN, 0),
    rounds: top === null || !n ? null : Math.round((k - n * top) * 10) / 10,
  };
}
