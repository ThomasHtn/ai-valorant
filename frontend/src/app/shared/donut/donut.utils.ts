import { DONUT_GAP, DONUT_RADIUS } from './donut.constants';
import { DonutSlice } from './donut.model';

/** Dash pattern and offset of each slice, clockwise from the top. */
export function donutArcs(
  slices: readonly DonutSlice[],
): { key: string; color: string; dash: string; offset: number }[] {
  const circumference = 2 * Math.PI * DONUT_RADIUS;
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  let start = 0;
  return slices.map((s) => {
    const length = total ? (s.value / total) * circumference : 0;
    const arc = {
      key: s.key,
      color: s.color,
      dash: `${Math.max(length - DONUT_GAP, 0).toFixed(1)} ${circumference.toFixed(1)}`,
      offset: -Number(start.toFixed(1)),
    };
    start += length;
    return arc;
  });
}
