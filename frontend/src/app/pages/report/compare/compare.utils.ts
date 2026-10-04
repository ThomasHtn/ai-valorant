import { formatGap } from '@core/format/value-format.utils';
import { halfPValue, twoProportionPValue } from '@core/report/proportion-test.utils';
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
 * Gap A - B of one metric. A rate gap is tested (z-test, Fisher on small samples) and stays grey when
 * it can come from chance; a mean, or a rate that is not a share of its sample, has no test and stays
 * grey. On a `mirror` measure (squad against its opponents on a symmetric stat) the opponents' rate is
 * 1 minus the squad's: the squad's rate is tested against 50 % instead.
 */
export function compareGap(
  a: CompareValue,
  b: CompareValue,
  column: StatColumn,
  mirror = false,
): CompareGap {
  if (typeof a.value !== 'number' || typeof b.value !== 'number') {
    return { text: '—', tone: 'ns', tip: 'Pas de valeur à comparer.' };
  }
  const gap = a.value - b.value;
  const text = formatGap(gap, column.format);
  if (column.format !== 'pct') {
    return { text, tone: 'ns', tip: 'Moyenne : pas de test sur cet écart.' };
  }
  if (column.proportion === false) {
    return { text, tone: 'ns', tip: "Taux qui n'est pas une part de l'échantillon : pas de test." };
  }
  const pValue = mirror
    ? halfPValue(a.value, a.sample)
    : twoProportionPValue(a.value, a.sample, b.value, b.sample);
  const significant = pValue < SIGNIFICANCE_LEVEL;
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

/** Columns worth comparing: figures with a reference (counts have none), not texts. */
function comparableColumns(columns: StatColumn[]): StatColumn[] {
  return columns.filter((c) => c.ref !== 'none' && c.format !== 'text' && c.format !== 'record');
}

function line(
  table: { id: string; title: string },
  row: StatRow | null,
  column: StatColumn,
  a: CompareValue,
  b: CompareValue,
  mirror = false,
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
    gap: compareGap(a, b, column, mirror),
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
        const cell = row.cells[column.key];
        const va = cohortValue(cell, a);
        const vb = cohortValue(cell, b);
        if (va.value !== null || vb.value !== null) {
          const symmetric = column.ref === 'hist' || cell?.ref === 'hist';
          lines.push(line(table, row, column, va, vb, symmetric && isSquadAgainstOpponents(a, b)));
        }
      }
    }
    if (lines.length) {
      groups.push({ id: table.id, title: table.title, lines });
    }
  }
  return groups;
}

/** The squad against its own opponents: on a symmetric stat, one rate is the mirror of the other. */
function isSquadAgainstOpponents(a: CompareCohort, b: CompareCohort): boolean {
  return (a === 'squad' && b === 'opp') || (a === 'opp' && b === 'squad');
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
      .filter((c) => c.format !== 'text' && c.format !== 'record')
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
