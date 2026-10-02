import { ContextRow } from '@core/periods/insights.model';
import { ChartBar } from '@shared/chart/chart.model';

import { CONTEXT_MIN_MATCHES } from './sessions-context.constants';

/**
 * Bars of rounds won (in %) for one breakdown. The best bar among those with enough matches is
 * highlighted; the ones under the minimum are greyed.
 */
export function contextBars(rows: ContextRow[]): ChartBar[] {
  const share = (row: ContextRow): number =>
    row.record.rounds.total ? (100 * row.record.rounds.count) / row.record.rounds.total : 0;
  const judged = rows.filter((row) => row.record.matches >= CONTEXT_MIN_MATCHES);
  const best = judged.length > 1 ? Math.max(...judged.map(share)) : null;
  return rows.map((row) => {
    const value = Math.round(share(row));
    const muted = row.record.matches < CONTEXT_MIN_MATCHES;
    return {
      label: row.label,
      value,
      valueLabel: `${value} %`,
      detail: `${row.record.matches} matchs, ${row.record.wins}V-${row.record.losses}D`,
      highlighted: !muted && best !== null && share(row) === best,
      muted,
    };
  });
}
