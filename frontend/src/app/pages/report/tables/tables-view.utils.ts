import { SIDE_LABELS } from '@core/format/labels.constants';
import { ReportFilters } from '@core/report/report-preferences.model';
import { StatRow } from '@core/report/stat-table.model';
import { rowText } from '@shared/stat-table/stat-table.utils';

/**
 * Row filter of one table for the scope filters (map, side, player), or null when none applies.
 * A filter only applies to tables whose rows name maps, players or sides: a table of round types
 * stays whole when a map is chosen, as the mockup does.
 */
export function scopeFilter(
  rows: StatRow[],
  filters: ReportFilters,
  maps: string[],
  players: string[],
): ((row: StatRow) => boolean) | null {
  const texts = rows.map(rowText);
  const mentions = (words: string[]): boolean =>
    texts.some((text) => words.some((word) => text.includes(word.toLowerCase())));
  const wanted: string[] = [];
  if (filters.map && mentions(maps)) {
    wanted.push(filters.map.toLowerCase());
  }
  if (filters.player && mentions(players)) {
    wanted.push(filters.player.toLowerCase());
  }
  if (filters.side && mentions(Object.values(SIDE_LABELS))) {
    wanted.push(SIDE_LABELS[filters.side].toLowerCase());
  }
  if (!wanted.length) {
    return null;
  }
  return (row) => {
    const text = rowText(row);
    return wanted.every((word) => text.includes(word));
  };
}
