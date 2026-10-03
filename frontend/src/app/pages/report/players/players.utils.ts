import { Reference } from '@core/common/enums.model';
import { REFERENCE_SHORT_LABELS } from '@core/format/labels.constants';
import { ValueFormat } from '@core/format/value-format.model';
import { formatValue, integer } from '@core/format/value-format.utils';
import { AgentRole } from '@core/game-assets/game-assets.model';
import { ROLE_LABELS } from '@core/game-assets/game-assets.constants';
import { ClutchLine, FormMatch, HeadlineStat } from '@core/report/players.model';
import { StatCell, StatColumn } from '@core/report/stat-table.model';
import { cellTone, referenceValue } from '@core/report/tone.utils';
import { CellTone } from '@core/report/tone.model';

import { CLUTCH_MIN_SAMPLE, PANEL_MIN_SAMPLE } from './players.constants';

/** French role name ('Duelliste'); the API's English name when unknown. */
export function roleLabel(role: string): string {
  return ROLE_LABELS[role as AgentRole] ?? role;
}

/**
 * A column describing a figure outside a table, so it is coloured by the same rule as table cells:
 * its format and direction, a minimum sample, compared with the analyst's reference.
 */
export function figureColumn(
  key: string,
  label: string,
  format: ValueFormat,
  better: number,
  min: number,
): StatColumn {
  return { key, label, format, better, min, ref: 'top', help: null };
}

/** Column of a headline tile. */
export function headlineColumn(stat: HeadlineStat): StatColumn {
  return figureColumn(stat.key, stat.label, stat.format, stat.better, stat.min);
}

/** Tone of a figure, or none when the analyst switched colours off. */
export function figureTone(
  cell: StatCell | undefined,
  column: StatColumn,
  reference: Reference,
  colours: boolean,
): CellTone | null {
  return colours ? cellTone(cell, column, reference) : null;
}

/** 'Top ranked 186 · 69 755': the reference value and its sample, or why there is none. */
export function referenceLine(cell: StatCell, reference: Reference, format: ValueFormat): string {
  const label = REFERENCE_SHORT_LABELS[reference];
  const { value, sample } = referenceValue(cell, reference);
  if (value === null || value === undefined) {
    return `${label} : pas de référence`;
  }
  return `${label} ${formatValue(value, format)}${sample ? ` · ${integer(sample)}` : ''}`;
}

/** 'Sur 445': the sample behind a figure; null when unknown. */
export function sampleLine(cell: StatCell): string | null {
  return cell.n ? `Sur ${integer(cell.n)}` : null;
}

/** A figure tile ready to draw (headline band, opening duels). */
export interface FigureTile {
  key: string;
  label: string;
  help: string | null;
  value: string;
  tone: CellTone | null;
  lines: string[];
}

/** Builds a tile from a cell: value, tone and the reference and sample lines. */
export function figureTile(
  key: string,
  label: string,
  help: string | null,
  cell: StatCell,
  column: StatColumn,
  reference: Reference,
  colours: boolean,
): FigureTile {
  const sample = sampleLine(cell);
  return {
    key,
    label,
    help,
    value: formatValue(cell.v, column.format),
    tone: figureTone(cell, column, reference, colours),
    lines: [referenceLine(cell, reference, column.format), ...(sample ? [sample] : [])],
  };
}

/** Headline band: the eight tiles of the player sheet. */
export function headlineTiles(
  headline: readonly HeadlineStat[],
  reference: Reference,
  colours: boolean,
): FigureTile[] {
  return headline.map((stat) =>
    figureTile(
      stat.key,
      stat.label,
      stat.help,
      stat.cell,
      headlineColumn(stat),
      reference,
      colours,
    ),
  );
}

/** A clutch size as a bar: the player's rate, a tick at the reference, its colour. */
export interface ClutchBar {
  situation: string;
  /** Bar and tick positions in %, 0..100. */
  width: number;
  tick: number | null;
  value: string;
  record: string;
  tone: CellTone | null;
}

export function clutchBars(
  lines: readonly ClutchLine[],
  reference: Reference,
  colours: boolean,
): ClutchBar[] {
  const column = figureColumn('clutch', 'Clutch', 'pct', 1, CLUTCH_MIN_SAMPLE);
  return lines.map((line) => {
    const rate = typeof line.cell.v === 'number' ? line.cell.v : null;
    const { value } = referenceValue(line.cell, reference);
    return {
      situation: line.situation,
      width: Math.round((rate ?? 0) * 100),
      tick: typeof value === 'number' ? Math.round(value * 100) : null,
      value: formatValue(rate, 'pct'),
      record: `${line.won}/${line.played}`,
      tone: figureTone(line.cell, column, reference, colours),
    };
  });
}

/**
 * Colour of one match's ACS: the match value against the player's ACS reference (same role), with no
 * minimum sample since a match is always one sample.
 */
export function formTone(
  match: FormMatch,
  acs: HeadlineStat | undefined,
  reference: Reference,
  colours: boolean,
): CellTone | null {
  if (!acs) {
    return null;
  }
  const cell: StatCell = { ...acs.cell, v: match.acs, n: null };
  return figureTone(cell, figureColumn('acs', 'ACS', 'int', 1, 0), reference, colours);
}

/** Column of an opening duel rate: a lower minimum than tables, a player has fewer duels than the squad. */
export function openingColumn(key: string, label: string): StatColumn {
  return figureColumn(key, label, 'pct', 1, PANEL_MIN_SAMPLE);
}
