/**
 * Scales of the hand-made SVG charts. Axes snap to round steps (1, 2, 2.5, 5 × 10^n) so every tick
 * label is a clean value, and a value always maps to the same pixel as its tick.
 */

/** A value axis: its bounds and the step between ticks. */
export interface AxisRange {
  min: number;
  max: number;
  step: number;
}

/** Round multipliers of a power of ten an axis step can use. */
const STEP_MULTIPLIERS = [1, 2, 2.5, 5, 10];

/** Smallest round step that splits `span` into at most `ticks` intervals. */
export function niceStep(span: number, ticks = 4): number {
  if (!(span > 0)) {
    return 1;
  }
  const raw = span / ticks;
  const power = 10 ** Math.floor(Math.log10(raw));
  const multiplier = STEP_MULTIPLIERS.find((m) => m * power >= raw) ?? 10;
  return multiplier * power;
}

/**
 * Axis covering `values` with a 20 % margin, snapped to round steps. Rates (0..1) never leave 0..1.
 * A single value gets a small band around it so it does not sit on the frame.
 */
export function niceRange(values: readonly number[], isRate: boolean): AxisRange {
  if (!values.length) {
    return { min: 0, max: 1, step: 0.25 };
  }
  let low = Math.min(...values);
  let high = Math.max(...values);
  if (high === low) {
    const pad = Math.abs(low) * 0.1 || 0.05;
    low -= pad;
    high += pad;
  }
  const step = niceStep((high - low) * 1.2);
  // The epsilon keeps a value sitting on a tick (0.55 / 0.05 = 11.000000000000002) on that tick.
  let min = clean(Math.floor(low / step + 1e-9) * step);
  let max = clean(Math.ceil(high / step - 1e-9) * step);
  if (isRate) {
    min = Math.max(0, min);
    max = Math.min(1, max);
  }
  return { min, max, step };
}

/** Tick values from `min` to `max` included, rounded so float steps print cleanly. */
export function tickValues(range: AxisRange): number[] {
  const ticks: number[] = [];
  // The epsilon keeps the last tick despite float drift (0.1 + 0.2...).
  for (let v = range.min; v <= range.max + range.step / 1000; v += range.step) {
    ticks.push(clean(v));
  }
  return ticks;
}

/** Drops float noise (0.6000000000000001 -> 0.6) so labels and comparisons stay exact. */
function clean(value: number): number {
  return Number(value.toFixed(10));
}

/** Linear map from a value domain to a pixel range; a flat domain maps to the range's middle. */
export function linearScale(
  domain: readonly [number, number],
  range: readonly [number, number],
): (value: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  if (d1 === d0) {
    return () => (r0 + r1) / 2;
  }
  return (value) => r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);
}
