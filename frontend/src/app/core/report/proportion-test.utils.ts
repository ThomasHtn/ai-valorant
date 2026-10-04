import {
  LANCZOS_COEFFICIENTS,
  LANCZOS_G,
  LOG_TOLERANCE,
  MIN_EXPECTED_COUNT,
} from './proportion-test.constants';

/**
 * Two-sided p-value of the gap between two rates, as the backend tests them: a two-proportion
 * z-test, or Fisher's exact test when an expected count is under 5 (small samples). Returns 1 when a
 * sample is missing or empty.
 *
 * @param p1 first rate (0..1), measured on `n1` tries
 * @param p2 second rate (0..1), measured on `n2` tries
 */
export function twoProportionPValue(
  p1: number | null,
  n1: number | null | undefined,
  p2: number | null,
  n2: number | null | undefined,
): number {
  if (p1 === null || p2 === null || !n1 || !n2) {
    return 1;
  }
  // Rates arrive rounded to 4 decimals: back to whole counts.
  const k1 = Math.round(p1 * n1);
  const k2 = Math.round(p2 * n2);
  const pooled = (k1 + k2) / (n1 + n2);
  const smallest = Math.min(n1 * pooled, n1 * (1 - pooled), n2 * pooled, n2 * (1 - pooled));
  if (smallest < MIN_EXPECTED_COUNT) {
    return fisherExact(k1, n1, k2, n2);
  }
  const standardError = Math.sqrt(pooled * (1 - pooled) * (1 / n1 + 1 / n2));
  if (!standardError) {
    return 1;
  }
  return Math.min(1, 2 * normalTail(Math.abs(k1 / n1 - k2 / n2) / standardError));
}

/**
 * Two-sided p-value of a rate against 50 % (exact binomial test). For a mirror measure, where the
 * opponents' rate is 1 minus the squad's on the same rounds, this is the only fair test.
 */
export function halfPValue(p: number | null, n: number | null | undefined): number {
  if (p === null || !n) {
    return 1;
  }
  const k = Math.round(p * n);
  const tail = Math.min(k, n - k);
  let sum = 0;
  for (let i = 0; i <= tail; i++) {
    sum += Math.exp(logChoose(n, i) - n * Math.LN2);
  }
  return Math.min(1, 2 * sum);
}

/** Fisher's exact test on [[k1, n1 - k1], [k2, n2 - k2]]: every table at most as likely as the observed one. */
export function fisherExact(k1: number, n1: number, k2: number, n2: number): number {
  const successes = k1 + k2;
  const logAll = logChoose(n1 + n2, successes);
  const logProbability = (a: number): number =>
    logChoose(n1, a) + logChoose(n2, successes - a) - logAll;
  const observed = logProbability(k1);
  let p = 0;
  for (let a = Math.max(0, successes - n2); a <= Math.min(successes, n1); a++) {
    const lp = logProbability(a);
    if (lp <= observed + LOG_TOLERANCE) {
      p += Math.exp(lp);
    }
  }
  return Math.min(1, p);
}

/** P(Z > z) for a standard normal Z (Abramowitz and Stegun 26.2.17, error below 7.5e-8). */
export function normalTail(z: number): number {
  const t = 1 / (1 + 0.2316419 * z);
  const density = 0.3989422804 * Math.exp((-z * z) / 2);
  const poly =
    t *
    (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return density * poly;
}

function logChoose(n: number, k: number): number {
  return logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1);
}

function logGamma(x: number): number {
  const z = x - 1;
  let sum = LANCZOS_COEFFICIENTS[0];
  for (let i = 1; i < LANCZOS_COEFFICIENTS.length; i++) {
    sum += LANCZOS_COEFFICIENTS[i] / (z + i);
  }
  const t = z + LANCZOS_G + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(sum);
}
