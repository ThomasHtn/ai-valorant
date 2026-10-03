import { ValueFormat } from '@core/format/value-format.model';
import { StatCell } from '@core/report/stat-table.model';
import { CellTone } from '@core/report/tone.model';
import { HoverTipContent } from '@shared/hover-tip/hover-tip.model';

/** A statistic placed on the radar: its cell and how to read it. */
export interface RadarStat {
  key: string;
  label: string;
  format: ValueFormat;
  /** 1 higher is better, -1 lower is better. */
  better: number;
  /** Sample under which the axis stays grey. */
  min: number;
  cell: StatCell;
}

/**
 * One player drawn on the radar. Without `colour` his points and values take the colour of their
 * tone (one player alone); with it, everything of his is drawn in that colour (players compared).
 */
export interface RadarSeries {
  name: string;
  stats: RadarStat[];
  colour: string | null;
}

/** One player's point on one axis, with its value written by the axis label. */
export interface RadarPoint {
  x: number;
  y: number;
  /** Colour of the point and of its value. */
  fill: string;
  value: string;
  /** True without a reference value or under the minimum sample: hollow grey point. */
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

/** One player's polygon. */
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
  /** Points attribute of each ring, the reference ring flagged. */
  rings: { points: string; reference: boolean }[];
}

/** Colour of a point by its tone, when one player is drawn alone. */
export type ToneColours = Readonly<Record<CellTone | 'none', string>>;
