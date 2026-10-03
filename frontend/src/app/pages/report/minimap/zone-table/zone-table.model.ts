import { ZoneRef, ZoneRow } from '@core/report/minimap.model';
import { HoverTipContent } from '@shared/hover-tip/hover-tip.model';

/** How a zone's first-death share compares with the top ranked. */
export type ZoneTone = 'over' | 'under' | 'even';

/** A zone row ready to draw. */
export interface ZoneLine {
  row: ZoneRow;
  /** 'Psilonnix 4, Izakiel 3'. */
  players: string;
  refs: ZoneRef[];
  share: string;
  topShare: string;
  /** '+11 pts', or '–' without a top ranked share. */
  excess: string;
  tone: ZoneTone;
  /** Bar and tick positions in %, 0..100. */
  shareWidth: number;
  topTick: number | null;
  shareTip: HoverTipContent;
  revenge: string;
}
