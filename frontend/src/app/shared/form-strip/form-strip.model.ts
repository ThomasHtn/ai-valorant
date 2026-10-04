import { HoverTipContent } from '@shared/hover-tip/hover-tip.model';

/** One bar of the strip, ready to draw. */
export interface FormBar {
  /** 'win', 'loss' or 'draw': which side of the axis and which colour. */
  result: 'win' | 'loss' | 'draw';
  /** Share of the half height, 0..1. */
  height: number;
  tip: HoverTipContent;
}
