/** A figure a point is compared with, in a fixed column right of the squad's own figure. */
export interface PointReference {
  /** Who the figure belongs to ('adversaire', 'top ranked'). */
  label: string;
  value: string | null;
}
