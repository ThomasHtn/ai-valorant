import { formatGap, formatValue } from '@core/format/value-format.utils';
import { StatTable } from '@core/report/stat-table.model';
import { parseRecord } from '@shared/win-loss/win-loss.utils';

import { MapBar } from './map-bars.model';

/** Points of rounds won on each side of 50 % that fill half the bar. */
export const MAP_BAR_SCALE_POINTS = 20;

/**
 * Maps of the period as bars: rounds won around 50 %, matches won and lost, the score gap per match,
 * and a hover tip comparing with the squad's history (`historyName`, 'Avant septembre').
 */
export function mapBars(table: StatTable, historyName: string): MapBar[] {
  return table.rows.map((row) => {
    const record = parseRecord(row.cells['wl']?.v ?? null) ?? { wins: 0, losses: 0 };
    const rw = row.cells['rw'];
    const rate = typeof rw?.v === 'number' ? rw.v : null;
    const diffValue =
      typeof row.cells['diff']?.v === 'number' ? (row.cells['diff'].v as number) : 0;
    const history = typeof rw?.hist === 'number' ? rw.hist : null;
    return {
      key: row.key,
      label: row.label,
      art: row.art ?? null,
      total: !!row.total,
      wins: record.wins,
      losses: record.losses,
      rate: formatValue(rate, 'pct'),
      points: rate === null ? 0 : Math.round((rate - 0.5) * 100),
      diff: `${formatGap(diffValue, 'dec1')} rounds par match`,
      diffSign: Math.sign(Math.round(diffValue * 10)),
      tip: {
        title: row.label,
        lines: [
          { label: 'Matchs', value: `${record.wins} gagnés, ${record.losses} perdus` },
          { label: 'Rounds gagnés', value: formatValue(rate, 'pct') },
          { label: historyName, value: formatValue(history, 'pct') },
          { label: 'Écart au score', value: `${formatGap(diffValue, 'dec1')} rounds par match` },
        ],
      },
    };
  });
}

/** Width in percent of half the bar for a gap in points, capped at the scale. */
export function halfWidth(points: number): number {
  return Math.min(100, (Math.abs(points) / MAP_BAR_SCALE_POINTS) * 100);
}
