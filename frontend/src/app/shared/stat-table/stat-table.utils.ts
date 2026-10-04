import { Reference } from '@core/common/enums.model';
import { REFERENCE_LABELS } from '@core/format/labels.constants';
import { formatValue, integer } from '@core/format/value-format.utils';
import { GameArt, StatCell, StatColumn, StatRow, StatTable } from '@core/report/stat-table.model';
import { cellTone, columnReference, referenceValue } from '@core/report/tone.utils';
import { CellTone } from '@core/report/tone.model';

import { parseRecord } from '@shared/win-loss/win-loss.utils';

import { NARROW_TABLE_COLUMNS } from './stat-table.constants';
import { RowView, StatDisplay, StatSort, TipLine } from './stat-table.model';

const REFERENCES: readonly Reference[] = ['top', 'opp', 'hist'];

/** Lower case words of a row, searched by the scope filters and the Rounds view. */
export function rowText(row: StatRow): string {
  return `${row.label} ${row.sub ?? ''} ${row.key}`.toLowerCase();
}

/**
 * Picture of a row: its own art, a player drawn by his avatar agent, or a row named after a squad
 * player ('Psilonnix', 'Psilonnix · Jett') drawn the same way.
 */
export function resolveRowArt(row: StatRow, playerAgents: Record<string, string>): GameArt | null {
  const toAgent = (name: string): GameArt | null => {
    const agent = playerAgents[name];
    return agent ? { type: 'agent', slug: agentSlug(agent) } : null;
  };
  if (row.art?.type === 'player') {
    const name = Object.keys(playerAgents).find(
      (n) => n.toLowerCase() === row.art?.slug.toLowerCase(),
    );
    return name ? toAgent(name) : null;
  }
  if (row.art) {
    return row.art;
  }
  const player = Object.keys(playerAgents).find(
    (n) => row.label === n || row.label.startsWith(`${n} `),
  );
  return player ? toAgent(player) : null;
}

/** Same slug rule as the asset files ('KAY/O' -> 'kayo'). */
function agentSlug(agent: string): string {
  return agent
    .toLowerCase()
    .replace('/', '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Rows sorted on one column, missing values last and the total row always at the bottom. */
export function sortRows(rows: StatRow[], sort: StatSort | null): StatRow[] {
  if (!sort) {
    return rows;
  }
  // A record sorts on its wins, not as text ('3-0' after '12-15').
  const value = (row: StatRow): number | string | null => {
    const v = row.cells[sort.key]?.v ?? null;
    return parseRecord(v)?.wins ?? v;
  };
  return [...rows].sort((a, b) => {
    if (a.total !== b.total) {
      return a.total ? 1 : -1;
    }
    const va = value(a);
    const vb = value(b);
    if (va === vb) {
      return 0;
    }
    if (va === null) {
      return 1;
    }
    if (vb === null) {
      return -1;
    }
    return (va > vb ? 1 : -1) * sort.direction;
  });
}

/** Next sort after a click on a column: descending, then ascending, then back to the API's order. */
export function nextSort(current: StatSort | null, key: string): StatSort | null {
  if (current?.key !== key) {
    return { key, direction: -1 };
  }
  return current.direction === -1 ? { key, direction: 1 } : null;
}

/** Every row of a table ready to draw: filtered, sorted, cells formatted and coloured. */
export function buildRowViews(
  table: StatTable,
  display: StatDisplay,
  playerAgents: Record<string, string>,
  keep: ((row: StatRow) => boolean) | null,
  sort: StatSort | null,
): RowView[] {
  const rows = sortRows(keep ? table.rows.filter((r) => r.total || keep(r)) : table.rows, sort);
  return rows.map((row) => ({
    row,
    art: resolveRowArt(row, playerAgents),
    cells: table.columns.map((column) => {
      const cell = row.cells[column.key];
      return {
        key: column.key,
        column,
        cell,
        text: formatValue(cell?.v, column.format),
        tone:
          column.format === 'record'
            ? recordTone(cell?.v)
            : cellTone(cell, column, display.reference),
      };
    }),
  }));
}

/** Colour of a won-lost record: green with more wins, red with more losses, orange when even. */
export function recordTone(value: StatCell['v'] | undefined): CellTone | null {
  const record = parseRecord(value);
  if (!record || record.wins + record.losses === 0) {
    return null;
  }
  if (record.wins === record.losses) {
    return 'avg';
  }
  return record.wins > record.losses ? 'good' : 'bad';
}

/** Lines of a cell tip: the squad, then every reference with a value, the colour's one marked. */
export function cellTipLines(cell: StatCell, column: StatColumn, chosen: Reference): TipLine[] {
  const sample = (n: number | null | undefined): string | null =>
    n === null || n === undefined ? null : integer(n);
  const lines: TipLine[] = [
    {
      label: "L'escouade",
      value: formatValue(cell.v, column.format),
      sample: sample(cell.n),
      isReference: false,
    },
  ];
  if (column.ref === 'none' || column.better === 0) {
    return lines;
  }
  const used = columnReference(column, chosen);
  for (const reference of REFERENCES) {
    const { value, sample: n } = referenceValue(cell, reference);
    if (value !== null && value !== undefined) {
      lines.push({
        label: REFERENCE_LABELS[reference],
        value: formatValue(value, column.format),
        sample: sample(n),
        isReference: reference === used,
      });
    }
  }
  return lines;
}

/** True for a table too wide to share a row: it then spans the whole block grid. */
export function isWideTable(table: Pick<StatTable, 'columns'>): boolean {
  return table.columns.length > NARROW_TABLE_COLUMNS;
}
