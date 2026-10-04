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

/** Clockwise quarter turns of the minimap, in degrees. */
export type MinimapRotation = 0 | 90 | 180 | 270;

/** A point of the square image after turning the image clockwise around its centre. */
export function rotatePoint<T extends { x: number; y: number }>(point: T, rotation: number): T {
  switch (rotation) {
    case 90:
      return { ...point, x: 1 - point.y, y: point.x };
    case 180:
      return { ...point, x: 1 - point.x, y: 1 - point.y };
    case 270:
      return { ...point, x: point.y, y: 1 - point.x };
    default:
      return point;
  }
}

/** The next quarter turn clockwise. */
export function nextRotation(rotation: number): MinimapRotation {
  return ((rotation + 90) % 360) as MinimapRotation;
}
