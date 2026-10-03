import { RewatchRound } from '@core/report/findings.model';
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
  /** '38 % contre 53 % (top ranked)'. */
  detail: string;
  /** '−8,5'. */
  gap: string;
  /** 'rounds sur 5 matchs'. */
  unit: string;
  /** Main causes of the lost rounds behind a weakness, or null. */
  causes: string | null;
  /** Other findings on the same subject, folded in the Points forts et faibles view. */
  others: number;
  rewatch: RewatchRound[];
}
