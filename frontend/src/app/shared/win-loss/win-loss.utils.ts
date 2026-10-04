import { CellValue } from '@core/report/stat-table.model';

import { WinLoss } from './win-loss.model';

/** Wins and losses of a record cell ('12-15'); null when the value is not a record. */
export function parseRecord(value: CellValue | undefined): WinLoss | null {
  const match = typeof value === 'string' ? /^(\d+)-(\d+)$/.exec(value) : null;
  return match ? { wins: Number(match[1]), losses: Number(match[2]) } : null;
}
