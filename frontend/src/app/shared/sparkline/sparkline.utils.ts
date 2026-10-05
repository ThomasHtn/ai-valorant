/** Geometry of `app-sparkline`, in a 100 by 100 box stretched to the host. */
export interface SparklineView {
  line: string;
  area: string;
  /** Height of the dashed reference, null for none. */
  reference: number | null;
  end: { x: number; y: number } | null;
}

const round = (n: number) => Math.round(n * 10) / 10;

/** A straight-segment line through the known values; the range pads values and reference by 20 %. */
export function buildSparkline(
  values: readonly (number | null)[],
  reference: number | null,
): SparklineView {
  const known = values
    .map((v, i) => ({ v, i }))
    .filter((p): p is { v: number; i: number } => p.v !== null);
  if (!known.length) {
    return { line: '', area: '', reference: null, end: null };
  }
  const all = known.map((p) => p.v).concat(reference === null ? [] : [reference]);
  const spread = Math.max(...all) - Math.min(...all);
  const pad = spread * 0.2 || Math.abs(all[0]) * 0.05 || 1;
  const low = Math.min(...all) - pad;
  const high = Math.max(...all) + pad;
  const x = (i: number) => (values.length > 1 ? 4 + (i * 92) / (values.length - 1) : 50);
  const y = (v: number) => 100 - ((v - low) / (high - low)) * 100;
  const points = known.map((p) => [round(x(p.i)), round(y(p.v))] as const);
  const line = points.map(([px, py], i) => `${i ? 'L' : 'M'}${px} ${py}`).join(' ');
  const [lastX, lastY] = points[points.length - 1];
  return {
    line,
    area: `${line} L${lastX} 100 L${points[0][0]} 100 Z`,
    reference: reference === null ? null : round(y(reference)),
    end: { x: lastX, y: lastY },
  };
}
