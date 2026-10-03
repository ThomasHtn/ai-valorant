import { GameArt } from '@core/report/stat-table.model';
import { resolveRowArt } from '@shared/stat-table/stat-table.utils';

/** Picture of a finding or a detection: player art becomes the player's avatar agent, like table rows. */
export function resolveArt(
  art: GameArt | null | undefined,
  playerAgents: Record<string, string>,
): GameArt | null {
  return art ? resolveRowArt({ key: '', label: '', cells: {}, art }, playerAgents) : null;
}
