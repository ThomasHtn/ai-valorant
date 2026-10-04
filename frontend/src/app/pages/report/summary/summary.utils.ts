import { Reference } from '@core/common/enums.model';
import { STATUS_LABELS } from '@core/format/labels.constants';
import {
  detailLabel,
  groupBySubject,
  referenceText,
  subjectLabel,
} from '@core/report/finding-subjects.utils';
import { Finding, FindingSide } from '@core/report/findings.model';
import { StatTable } from '@core/report/stat-table.model';

import { HeadlineTile } from './headline-tile/headline-tile.model';
import { headlineTile } from './headline-tile/headline-tile.utils';
import {
  HEADLINE_MAP_COLUMNS,
  HEADLINE_ROUND_TYPE,
  HEADLINE_UNITS,
  HEADLINE_VALUE_UNITS,
} from './summary.constants';
import { PriorityItem } from './summary.model';

/** The table with only the given columns, in that order; rows are kept as they are. */
export function pickColumns(table: StatTable, keys: readonly string[]): StatTable {
  const columns = keys
    .map((key) => table.columns.find((c) => c.key === key))
    .filter((c) => c !== undefined);
  return { ...table, columns };
}

/** The table with some columns renamed, by key; other columns keep the API's label. */
export function relabelColumns(table: StatTable, labels: Record<string, string>): StatTable {
  return {
    ...table,
    columns: table.columns.map((c) => (labels[c.key] ? { ...c, label: labels[c.key] } : c)),
  };
}

/**
 * Headline tiles of the period: rounds won, gap per match, attack, defense and pistols over every
 * map, then full buy against full buy, each coloured like its table cell.
 */
export function headlineTiles(
  maps: StatTable | undefined,
  roundTypes: StatTable | undefined,
  reference: Reference,
  historyName: string,
): HeadlineTile[] {
  const tiles: HeadlineTile[] = [];
  const total = maps?.rows.find((r) => r.total);
  for (const key of HEADLINE_MAP_COLUMNS) {
    const column = maps?.columns.find((c) => c.key === key);
    const cell = total?.cells[key];
    if (column && cell) {
      tiles.push(
        headlineTile(
          key,
          column.label,
          column.help ?? null,
          cell,
          column,
          reference,
          historyName,
          HEADLINE_UNITS[key],
          HEADLINE_VALUE_UNITS[key] ?? null,
        ),
      );
    }
  }
  const fullBuy = roundTypes?.rows.find((r) => r.label === HEADLINE_ROUND_TYPE);
  const rw = roundTypes?.columns.find((c) => c.key === 'rw');
  if (fullBuy && rw && fullBuy.cells['rw']) {
    tiles.push(
      headlineTile(
        'fullbuy',
        fullBuy.label,
        rw.help ?? null,
        fullBuy.cells['rw'],
        rw,
        reference,
        historyName,
        HEADLINE_UNITS['fullbuy'],
        null,
      ),
    );
  }
  return tiles;
}

/**
 * The `count` costliest subjects of the weaknesses (or strengths), each led by its biggest finding;
 * overlapping findings on the same map or player are counted once, not listed again.
 */
export function priorityItems(
  findings: readonly Finding[],
  side: FindingSide,
  count: number,
): PriorityItem[] {
  return groupBySubject(findings.filter((f) => f.side === side))
    .slice(0, count)
    .map(({ key, lead }) => ({
      key,
      art: lead.art,
      scope: subjectLabel(lead),
      metric: detailLabel(lead),
      status: STATUS_LABELS[lead.status],
      confirmed: lead.status === 'confirmed',
      detail: referenceText(lead),
      gapRounds: lead.gapRounds,
      matches: lead.matches,
    }));
}
