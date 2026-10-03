import { Reference } from '@core/common/enums.model';
import { STATUS_LABELS } from '@core/format/labels.constants';
import { formatGap, formatValue } from '@core/format/value-format.utils';
import { Finding, FindingSide } from '@core/report/findings.model';
import { StatTable } from '@core/report/stat-table.model';

import { FigureTile, figureTile } from '../players/players.utils';
import { HEADLINE_MAP_COLUMNS, HEADLINE_ROUND_TYPE } from './summary.constants';
import { PriorityItem } from './summary.model';

/** The table with only the given columns, in that order; rows are kept as they are. */
export function pickColumns(table: StatTable, keys: readonly string[]): StatTable {
  const columns = keys
    .map((key) => table.columns.find((c) => c.key === key))
    .filter((c) => c !== undefined);
  return { ...table, columns };
}

/**
 * Headline tiles of the period: rounds won, gap per match, attack, defense and pistols over every
 * map, then full buy against full buy, each coloured like its table cell.
 */
export function headlineTiles(
  maps: StatTable | undefined,
  roundTypes: StatTable | undefined,
  reference: Reference,
  colours: boolean,
): FigureTile[] {
  const tiles: FigureTile[] = [];
  const total = maps?.rows.find((r) => r.total);
  for (const key of HEADLINE_MAP_COLUMNS) {
    const column = maps?.columns.find((c) => c.key === key);
    const cell = total?.cells[key];
    if (column && cell) {
      tiles.push(
        figureTile(key, column.label, column.help ?? null, cell, column, reference, colours),
      );
    }
  }
  const fullBuy = roundTypes?.rows.find((r) => r.label === HEADLINE_ROUND_TYPE);
  const rw = roundTypes?.columns.find((c) => c.key === 'rw');
  if (fullBuy && rw && fullBuy.cells['rw']) {
    tiles.push(
      figureTile(
        'fullbuy',
        fullBuy.label,
        rw.help ?? null,
        fullBuy.cells['rw'],
        rw,
        reference,
        colours,
      ),
    );
  }
  return tiles;
}

/** The `count` costliest weaknesses (or biggest strengths) in rounds, ready to draw. */
export function priorityItems(
  findings: readonly Finding[],
  side: FindingSide,
  count: number,
): PriorityItem[] {
  return findings
    .filter((f) => f.side === side)
    .sort((a, b) => Math.abs(b.gapRounds) - Math.abs(a.gapRounds))
    .slice(0, count)
    .map((f, index) => {
      const reference = f.reference === 'opp' ? f.opp : f.top;
      const referenceName = f.reference === 'opp' ? 'adversaires' : 'top ranked';
      return {
        key: `${side}-${index}`,
        art: f.art,
        scope: f.scope,
        metric: f.metric,
        status: STATUS_LABELS[f.status],
        confirmed: f.status === 'confirmed',
        detail: `${formatValue(f.squad.value, 'pct')} contre ${formatValue(reference.value, 'pct')} (${referenceName})`,
        gap: formatGap(f.gapRounds, 'dec1'),
        rewatch: f.rewatch,
      };
    });
}
