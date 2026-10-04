import { GameArt } from '@core/report/stat-table.model';
import { HoverTipContent } from '@shared/hover-tip/hover-tip.model';

/** One map of the Résumé drawn as a bar of rounds won around the even line. */
export interface MapBar {
  key: string;
  label: string;
  art: GameArt | null;
  total: boolean;
  wins: number;
  losses: number;
  /** '62 %'. */
  rate: string;
  /** Rounds won above (+) or below (-) 50 %, in points, for the bar. */
  points: number;
  /** '+5,0 rounds par match'. */
  diff: string;
  /** Sign of the score gap, for its colour. */
  diffSign: number;
  tip: HoverTipContent;
}
