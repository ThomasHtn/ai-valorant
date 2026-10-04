import { ColumnReference } from '@core/common/enums.model';
import { ValueFormat } from '@core/format/value-format.model';

/**
 * Coloured statistics tables of the Tableaux view, mirror of `backend/src/valostats/schemas/report/tables.py`.
 * The API never sends colours: each cell carries the squad value, its sample and the same metric for
 * every reference, and the front colours it against the reference the analyst chose (`tone.utils.ts`).
 */

/** Kind of game picture in front of a row; the image path is built from the slug. */
export type ArtType = 'map' | 'agent' | 'weapon' | 'role' | 'player';

export interface GameArt {
  type: ArtType;
  /** Lower case name, non-alphanumerics as "-" ("kay-o"); for a player, his name. */
  slug: string;
}

/** A value: a number for figures, a string for text cells ("12-15", "Platinum 1"). */
export type CellValue = number | string | null;

/** A squad value with its sample, and the same metric for each reference (null when not computed). */
export interface StatCell {
  v: CellValue;
  /** Sample behind the value: rounds, deaths, duels... */
  n?: number | null;
  top?: CellValue;
  topN?: number | null;
  opp?: CellValue;
  oppN?: number | null;
  hist?: CellValue;
  histN?: number | null;
}

export interface StatColumn {
  key: string;
  label: string;
  format: ValueFormat;
  /** 1 higher is better, -1 lower is better, 0 neutral (never coloured). */
  better: number;
  /** Glossary key of the column's "i" tip. */
  help?: string | null;
  /** Sample under which a cell stays grey. */
  min: number;
  /** `top` follows the analyst's choice of reference; `hist` is forced; `none` is never coloured. */
  ref: ColumnReference;
}

export interface StatRow {
  key: string;
  label: string;
  art?: GameArt | null;
  sub?: string | null;
  /** Agents of a composition, drawn under the label as portraits with their names. */
  agents?: string[] | null;
  cells: Record<string, StatCell>;
  /** Summary row ("Toutes les cartes"), kept last when sorting. */
  total?: boolean;
}

export interface StatTable {
  id: string;
  title: string;
  rowsLabel: string;
  help?: string | null;
  note?: string | null;
  columns: StatColumn[];
  rows: StatRow[];
}

/** Every table of one domain (Résultats, Ouvertures, Combat...). */
export interface DomainTables {
  key: string;
  label: string;
  tables: StatTable[];
}
