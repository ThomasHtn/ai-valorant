/**
 * SVG path data of the marker shapes, centred on (x, y) with a radius `r`, in minimap units.
 * Circles are drawn as `<circle>` elements and need no path.
 */

/** Square standing on a corner. */
export function diamondPath(x: number, y: number, r: number): string {
  const d = r * 1.3;
  return `M${x} ${y - d}L${x + d} ${y}L${x} ${y + d}L${x - d} ${y}Z`;
}

/** Triangle pointing up. */
export function trianglePath(x: number, y: number, r: number): string {
  return `M${x} ${y - r * 1.2}L${x + r * 1.1} ${y + r * 0.8}L${x - r * 1.1} ${y + r * 0.8}Z`;
}

/** Two crossed strokes. */
export function crossPath(x: number, y: number, r: number): string {
  return `M${x - r} ${y - r}L${x + r} ${y + r}M${x + r} ${y - r}L${x - r} ${y + r}`;
}

/** Keeps a marker on the image even if the API sent a point slightly outside. */
export function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** A marker ready to draw: clamped position and the path of the shapes drawn as paths. */
export interface MarkerView<T> {
  marker: T;
  x: number;
  y: number;
  path: string | null;
}

/** Positions clamped to the image, paths computed once per change rather than in the template. */
export function markerViews<T extends { x: number; y: number; shape: string }>(
  markers: readonly T[],
  radius: number,
): MarkerView<T>[] {
  return markers.map((marker) => {
    const x = clampUnit(marker.x);
    const y = clampUnit(marker.y);
    const path =
      marker.shape === 'diamond'
        ? diamondPath(x, y, radius)
        : marker.shape === 'triangle'
          ? trianglePath(x, y, radius)
          : marker.shape === 'cross'
            ? crossPath(x, y, radius)
            : null;
    return { marker, x, y, path };
  });
}
