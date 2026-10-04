import { HoverTipContent } from '@shared/hover-tip/hover-tip.model';

import { PlayerFigure } from '../players-figure.model';

/**
 * One player drawn on the radar. Without `colour` his points take the colour of their tone (one
 * player alone); with it, everything of his is drawn in that colour (players compared).
 */
export interface RadarSeries {
  name: string;
  stats: PlayerFigure[];
  colour: string | null;
}

/** One player's point on one axis. */
export interface RadarPoint {
  x: number;
  y: number;
  /** Colour of the point and of its value. */
  fill: string;
  value: string;
  /** True without a scale or under the minimum sample: hollow grey point. */
  faint: boolean;
  tip: HoverTipContent;
}

/** One axis ready to draw: its spoke, its label, and one point per player. */
export interface RadarAxisView {
  key: string;
  /** End of the spoke at the rim. */
  rimX: number;
  rimY: number;
  labelX: number;
  labelY: number;
  valueY: number;
  /** Name's line when it is written without the values. */
  nameY: number;
  anchor: 'start' | 'middle' | 'end';
  label: string;
  points: RadarPoint[];
}

/** A polygon: a player, or the reference of a lone player. */
export interface RadarShape {
  name: string;
  points: string;
  colour: string;
}

export interface RadarView {
  width: number;
  height: number;
  cx: number;
  cy: number;
  axes: RadarAxisView[];
  shapes: RadarShape[];
  /** The reference's own profile, drawn dashed; null when players are compared or values miss. */
  reference: RadarShape | null;
  /** Points attribute of each ring. */
  rings: string[];
}
