import { Tone } from '@core/common/enums.model';

import {
  REFERENCE_AVERAGE_BAND,
  REFERENCE_AVERAGE_SHARE,
  RatedStat,
  STAT_THRESHOLDS,
} from './rating.constants';
import { Rating, RatingThresholds } from './rating.model';

/** Rating of a value against fixed benchmarks. */
export function rateValue(value: number | null | undefined, thresholds: RatingThresholds): Rating {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'unknown';
  }
  const higherIsBetter = thresholds.higherIsBetter ?? true;
  const [score, bad, good] = higherIsBetter
    ? [value, thresholds.bad, thresholds.good]
    : [-value, -thresholds.bad, -thresholds.good];
  if (score >= good) {
    return 'good';
  }
  return score < bad ? 'bad' : 'average';
}

/** Rating of one of the benchmarked stats. */
export function rateStat(stat: RatedStat, value: number | null | undefined): Rating {
  return rateValue(value, STAT_THRESHOLDS[stat]);
}

/**
 * Rating of a value against a reference (opponents, top ranked, a previous period): close to it
 * is average. `band` is absolute for rates; for means, pass `relative` to scale it on the reference.
 */
export function rateAgainst(
  value: number | null | undefined,
  reference: number | null | undefined,
  options: { higherIsBetter?: boolean; band?: number; relative?: boolean } = {},
): Rating {
  if (value === null || value === undefined || reference === null || reference === undefined) {
    return 'unknown';
  }
  const band = options.relative
    ? Math.abs(reference) * (options.band ?? REFERENCE_AVERAGE_SHARE)
    : (options.band ?? REFERENCE_AVERAGE_BAND);
  const gap = (value - reference) * ((options.higherIsBetter ?? true) ? 1 : -1);
  if (gap > band) {
    return 'good';
  }
  return gap < -band ? 'bad' : 'average';
}

/** Rating of a gap the API already judged statistically: a gap that is not clear reads average. */
export function rateTone(tone: Tone | null | undefined): Rating {
  if (!tone) {
    return 'unknown';
  }
  return tone === 'neutral' ? 'average' : tone;
}
