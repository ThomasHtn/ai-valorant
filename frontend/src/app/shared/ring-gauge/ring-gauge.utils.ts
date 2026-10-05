import { RING_RADIUS } from './ring-gauge.constants';

/** Dash pattern of an arc covering `share` (0..1) of the ring. */
export function ringDash(share: number): string {
  const length = Math.max(0, Math.min(1, share)) * 100;
  return `${length} ${100 - length}`;
}

/** Inner and outer ends of a tick across a ring `width` thick at `share` (0..1), from the top, clockwise. */
export function ringTick(
  share: number,
  width = 3.5,
): { x1: number; y1: number; x2: number; y2: number } {
  const angle = Math.max(0, Math.min(1, share)) * 2 * Math.PI - Math.PI / 2;
  const at = (r: number) => ({ x: 18 + Math.cos(angle) * r, y: 18 + Math.sin(angle) * r });
  const inner = at(RING_RADIUS - width);
  const outer = at(RING_RADIUS + width);
  const round = (n: number) => Math.round(n * 100) / 100;
  return { x1: round(inner.x), y1: round(inner.y), x2: round(outer.x), y2: round(outer.y) };
}
