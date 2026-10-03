import { Histogram, HistogramBin } from '@core/report/distributions.model';

/** Drawn geometry of `app-histogram`, in viewBox units. */

/** What a histogram is drawn from. */
export interface HistogramInput {
  bins: readonly HistogramBin[];
  /** Width of a bin, so an open last bin ('90+') gets one bin of room. */
  binSize: number;
  /** Unit of the values ('s', 'm', 'ACS'), written after the medians. */
  unit: string;
  squad: Histogram;
  /** Null to draw the squad alone. */
  top: Histogram | null;
  /** Who the filled bars are, in the median label ('escouade', a player's name). */
  squadName: string;
}

/** One bin: the squad's bar and the top ranked outline over it. */
export interface BarView {
  x: number;
  width: number;
  /** Top of the squad bar and its height. */
  y: number;
  height: number;
  /** SVG path of the top ranked outline (open at the bottom), null without top ranked. */
  topPath: string | null;
  label: string;
  squadShare: string;
  squadCount: string;
  topShare: string | null;
  topCount: string | null;
}

export interface HistogramTick {
  at: number;
  label: string;
}

export interface HistogramXLabel {
  x: number;
  label: string;
  anchor: 'start' | 'middle' | 'end';
}

export interface MedianView {
  x: number;
  label: string;
  /** CSS colour of the line and its label. */
  colour: string;
  /** Extra vertical offset of the label so two close medians do not overlap. */
  shift: number;
}

export interface HistogramView {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  yTicks: HistogramTick[];
  bars: BarView[];
  xLabels: HistogramXLabel[];
  medians: MedianView[];
}
