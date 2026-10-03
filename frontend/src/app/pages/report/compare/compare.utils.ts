import { formatGap } from '@core/format/value-format.utils';
import { twoProportionPValue } from '@core/report/proportion-test.utils';
import { DomainTables, StatCell, StatColumn, StatRow } from '@core/report/stat-table.model';

import { MAX_ROWS_PER_TABLE, SIGNIFICANCE_LEVEL, SORTED_GROUP_TITLE } from './compare.constants';
import {
  CompareCohort,
  CompareGap,
  CompareGroup,
  CompareLine,
  CompareSort,
  CompareValue,
} from './compare.model';

/** What one team selection reads in a cell: the squad value, or one of the references. */
export function cohortValue(cell: StatCell | undefined, cohort: CompareCohort): CompareValue {
  if (!cell) {
    return { value: null, sample: null };
  }
  if (cohort === 'squad') {
    return { value: cell.v, sample: cell.n ?? null };
  }
  const sampleKey = `${cohort}N` as const;
  return { value: cell[cohort] ?? null, sample: cell[sampleKey] ?? null };
}

/**
 * Gap A - B of one metric. A rate gap is tested (two-proportion z-test) and stays grey when it can
 * come from chance; a mean has no test here and stays grey.
 */
export function compareGap(a: CompareValue, b: CompareValue, column: StatColumn): CompareGap {
  if (typeof a.value !== 'number' || typeof b.value !== 'number') {
    return { text: '—', tone: 'ns', tip: 'Pas de valeur à comparer.' };
  }
  const gap = a.value - b.value;
  const text = formatGap(gap, column.format);
  if (column.format !== 'pct') {
    return { text, tone: 'ns', tip: 'Moyenne : pas de test sur cet écart.' };
  }
  const significant =
    twoProportionPValue(a.value, a.sample, b.value, b.sample) < SIGNIFICANCE_LEVEL;
  if (!significant || column.better === 0) {
    return {
      text,
      tone: 'ns',
      tip: significant
        ? 'Écart significatif, sans sens meilleur ou moins bon.'
        : 'Écart compatible avec le hasard sur ces échantillons.',
    };
  }
  return {
    text,
    tone: gap * column.better > 0 ? 'good' : 'bad',
    tip: 'Écart significatif (p < 0,05).',
  };
}

/** Columns worth comparing: coloured ones, not counts nor texts. */
function comparableColumns(columns: StatColumn[]): StatColumn[] {
  return columns.filter((c) => c.ref !== 'none' && c.format !== 'text' && c.format !== 'int');
}

function line(
  table: { id: string; title: string },
  row: StatRow | null,
  column: StatColumn,
  a: CompareValue,
  b: CompareValue,
): CompareLine {
  return {
    // Table id first: once every table is mixed in one list, keys stay unique.
    key: `${table.id}:${row?.key ?? ''}:${column.key}`,
    source: table.title,
    rowLabel: row?.label ?? '',
    rowSub: row?.sub ?? null,
    columnLabel: column.label,
    help: column.help ?? null,
    format: column.format,
    a,
    b,
    gap: compareGap(a, b, column),
  };
}

/**
 * Team mode: every comparable metric of every table for two selections read in the same cells.
 * `keepRow` applies the scope filters of each table (null keeps every row).
 */
export function teamGroups(
  domain: DomainTables,
  a: CompareCohort,
  b: CompareCohort,
  keepRow: (tableId: string) => ((row: StatRow) => boolean) | null,
): CompareGroup[] {
  const groups: CompareGroup[] = [];
  for (const table of domain.tables) {
    const columns = comparableColumns(table.columns);
    if (!columns.length) {
      continue;
    }
    const keep = keepRow(table.id);
    const rows = table.rows.filter((r) => r.total || !keep || keep(r)).slice(0, MAX_ROWS_PER_TABLE);
    const lines: CompareLine[] = [];
    for (const row of rows) {
      for (const column of columns) {
        const va = cohortValue(row.cells[column.key], a);
        const vb = cohortValue(row.cells[column.key], b);
        if (va.value !== null || vb.value !== null) {
          lines.push(line(table, row, column, va, vb));
        }
      }
    }
    if (lines.length) {
      groups.push({ id: table.id, title: table.title, lines });
    }
  }
  return groups;
}

/** Row of a player in a table: his own row, or his first 'Player · Agent' row. */
export function playerRow(rows: StatRow[], player: string): StatRow | null {
  return rows.find((r) => r.label === player || r.label.startsWith(`${player} `)) ?? null;
}

/** Player mode: the tables with a row for each player, every metric of A's row against B's. */
export function playerGroups(
  domain: DomainTables,
  playerA: string,
  playerB: string,
): CompareGroup[] {
  const groups: CompareGroup[] = [];
  for (const table of domain.tables) {
    const rowA = playerRow(table.rows, playerA);
    const rowB = playerRow(table.rows, playerB);
    if (!rowA || !rowB) {
      continue;
    }
    const lines = table.columns
      .filter((c) => c.format !== 'text')
      .filter((c) => rowA.cells[c.key] && rowB.cells[c.key])
      .map((c) =>
        line(
          table,
          null,
          c,
          cohortValue(rowA.cells[c.key], 'squad'),
          cohortValue(rowB.cells[c.key], 'squad'),
        ),
      );
    if (lines.length) {
      groups.push({ id: table.id, title: table.title, lines });
    }
  }
  return groups;
}

/**
 * Size of a gap, comparable across formats: points for a rate (0.05 = 5 points), the relative gap
 * for a mean (0.05 = 5 % of B). Null when a side is missing.
 */
export function gapSize(line: CompareLine): number | null {
  const { value: a } = line.a;
  const { value: b } = line.b;
  if (typeof a !== 'number' || typeof b !== 'number') {
    return null;
  }
  if (line.format === 'pct') {
    return Math.abs(a - b);
  }
  return b === 0 ? Math.abs(a) : Math.abs(a - b) / Math.abs(b);
}

/**
 * Lines as the analyst asked: only the gaps that hold (not grey) when `netOnly`, and either the
 * domain's tables in order or a single list of every table, biggest gap first. A gap that holds
 * comes before a grey one of the same size.
 */
export function arrangeGroups(
  groups: readonly CompareGroup[],
  sort: CompareSort,
  netOnly: boolean,
): CompareGroup[] {
  const kept = groups
    .map((g) => ({ ...g, lines: netOnly ? g.lines.filter((l) => l.gap.tone !== 'ns') : g.lines }))
    .filter((g) => g.lines.length);
  if (sort === 'tables') {
    return kept;
  }
  const lines = kept
    .flatMap((g) => g.lines)
    .map((l) => ({ line: l, size: gapSize(l) ?? -1, net: l.gap.tone !== 'ns' }))
    .sort((x, y) => y.size - x.size || Number(y.net) - Number(x.net))
    .map((x) => x.line);
  return lines.length ? [{ id: 'sorted', title: SORTED_GROUP_TITLE, lines, mixed: true }] : [];
}
