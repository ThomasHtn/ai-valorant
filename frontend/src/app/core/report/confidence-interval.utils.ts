/** z of a two-sided 95 % interval. */
const Z_95 = 1.96;

/**
 * Wilson interval of a rate measured on `total` tries (95 % by default): the range where the true
 * rate most likely is. Null when there is no sample. Stays inside 0..1 even for tiny samples.
 */
export function wilsonInterval(
  rate: number | null,
  total: number | null | undefined,
  z = Z_95,
): { low: number; high: number } | null {
  if (rate === null || !total) {
    return null;
  }
  const z2 = z * z;
  const centre = (rate + z2 / (2 * total)) / (1 + z2 / total);
  const margin =
    (z / (1 + z2 / total)) * Math.sqrt((rate * (1 - rate)) / total + z2 / (4 * total * total));
  return { low: Math.max(0, centre - margin), high: Math.min(1, centre + margin) };
}
