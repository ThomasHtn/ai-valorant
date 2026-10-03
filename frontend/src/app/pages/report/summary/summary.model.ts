import { RewatchRound } from '@core/report/findings.model';
import { GameArt } from '@core/report/stat-table.model';

/** One weakness or strength of the summary, ready to draw. */
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
  rewatch: RewatchRound[];
}
