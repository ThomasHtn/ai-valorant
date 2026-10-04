import { CellTone } from '@core/report/tone.model';
import { HoverTipContent } from '@shared/hover-tip/hover-tip.model';

/** Which way the figure moved against its reference. */
export type DeltaDirection = 'up' | 'down' | 'flat';

/** A headline figure of the Résumé, ready to draw: ring, value, gap arrow and its explanation. */
export interface HeadlineTile {
  key: string;
  label: string;
  help: string | null;
  /** '48 %', '−1,0'. */
  value: string;
  /** Written small after a value that has no unit of its own ('rounds'). */
  unit: string | null;
  tone: CellTone | null;
  /** Share drawn by the ring (rates only), and the reference tick on it. */
  ring: { value: number; reference: number | null } | null;
  /** Gap with the reference: arrow, '−2 pts', colour of the verdict; null without reference. */
  delta: { direction: DeltaDirection; text: string } | null;
  /** 'vs avant septembre (50 %)'. */
  referenceLine: string | null;
  /** 'Sur 576 rounds'. */
  sample: string | null;
  /** What the arrow means, in words, on hover. */
  tip: HoverTipContent;
}
