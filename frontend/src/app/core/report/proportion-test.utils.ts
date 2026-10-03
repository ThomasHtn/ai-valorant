/**
 * Two-sided p-value of a two-proportion z-test: how likely a gap at least this big would be if both
 * rates came from the same underlying rate. Returns 1 when a sample is missing or empty.
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
  const pooled = (p1 * n1 + p2 * n2) / (n1 + n2);
  const standardError = Math.sqrt(pooled * (1 - pooled) * (1 / n1 + 1 / n2));
  if (!standardError) {
    return 1;
  }
  return 2 * normalTail(Math.abs(p1 - p2) / standardError);
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
