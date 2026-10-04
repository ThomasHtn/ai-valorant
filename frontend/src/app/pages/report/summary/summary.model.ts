import { GameArt } from '@core/report/stat-table.model';

/** One subject (map, player...) of the summary's weaknesses or strengths, ready to draw. */
export interface PriorityItem {
  key: string;
  art: GameArt | null;
  scope: string;
  metric: string;
  /** 'Écart net' or 'À confirmer'. */
  status: string;
  confirmed: boolean;
  /** '38 % contre 53 % au top ranked'. */
  detail: string;
  /** Rounds won (+) or lost (-) against the reference. */
  gapRounds: number;
  /** Distinct matches behind the gap. */
  matches: number;
}
