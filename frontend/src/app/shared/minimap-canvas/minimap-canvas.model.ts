import { HoverTipContent } from '@shared/hover-tip/hover-tip.model';

/** How a marker is drawn; each layer of a view picks one so layers stay apart without colour alone. */
export type MarkerShape =
  'dot' | 'ring' | 'thickRing' | 'diamond' | 'cross' | 'triangle' | 'player';

/** A point on the minimap; `x` and `y` are fractions of the image (0..1). */
export interface MinimapMarker {
  /** Unique within the canvas (tracking key). */
  id: string;
  x: number;
  y: number;
  shape: MarkerShape;
  /** CSS colour, usually a theme variable ('var(--color-rating-bad)'). */
  color: string;
  /** Drawn faint (another player's point while one player is selected). */
  dimmed?: boolean;
  /** Amber ring around the marker (the player acting in a replay). */
  emphasis?: boolean;
  /** Name written next to the marker. */
  label?: string;
  labelColor?: string;
  tip?: HoverTipContent | null;
  /** Router commands opened on click (period kept); no link means not clickable. */
  link?: string[] | null;
}

/** A faint place name drawn on the map (a callout). */
export interface MinimapLabel {
  name: string;
  x: number;
  y: number;
}

/** A circled spot (the zone hovered in a table). */
export interface MinimapHighlight {
  x: number;
  y: number;
}
