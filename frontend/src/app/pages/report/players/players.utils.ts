import { Reference } from '@core/common/enums.model';
import { REFERENCE_SHORT_LABELS } from '@core/format/labels.constants';
import { ValueFormat } from '@core/format/value-format.model';
import { formatValue, integer } from '@core/format/value-format.utils';
import { AgentRole } from '@core/game-assets/game-assets.model';
import { ROLE_LABELS } from '@core/game-assets/game-assets.constants';
import {
  ClutchLine,
  DeathZone,
  FormMatch,
  HeadlineStat,
  OpeningDuels,
} from '@core/report/players.model';
import { StatCell, StatColumn } from '@core/report/stat-table.model';
import { cellTone, columnReference, referenceValue } from '@core/report/tone.utils';
import { CellTone } from '@core/report/tone.model';

import {
  CLUTCH_MIN_SAMPLE,
  PANEL_MIN_SAMPLE,
  ZONE_HIGH_RATIO,
  ZONE_MIN_DEATHS,
} from './players.constants';

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

/**
 * 'Top ranked 186': the value of the reference the figure is really coloured against (the squad's
 * history for symmetric figures such as rounds won), or why there is none. Its sample stays out:
 * a tile shows a single sample, the squad's.
 */
export function referenceLine(
  cell: StatCell,
  column: StatColumn,
  chosen: Reference,
): string | null {
  const reference = columnReference(column, chosen);
  if (!reference) {
    return null;
  }
  const label = REFERENCE_SHORT_LABELS[reference];
  const { value } = referenceValue(cell, reference);
  if (value === null || value === undefined) {
    return `${label} : pas de référence`;
  }
  return `${label} ${formatValue(value, column.format)}`;
}

/** 'Sur 445 rounds': the sample behind a figure, with its unit when known; null when unknown. */
export function sampleLine(cell: StatCell, unit: string | null = null): string | null {
  return cell.n ? `Sur ${integer(cell.n)}${unit ? ` ${unit}` : ''}` : null;
}

/** A figure tile ready to draw (headline band, opening duels). */
export interface FigureTile {
  key: string;
  label: string;
  help: string | null;
  value: string;
  tone: CellTone | null;
  lines: string[];
  /** 1 higher is better, -1 lower is better. */
  better: number;
}

/** Builds a tile from a cell: value, tone, then the reference line and the sample line ('Sur 445 rounds'). */
export function figureTile(
  key: string,
  label: string,
  help: string | null,
  cell: StatCell,
  column: StatColumn,
  reference: Reference,
  colours: boolean,
  unit: string | null = null,
): FigureTile {
  const lines = [referenceLine(cell, column, reference), sampleLine(cell, unit)];
  return {
    key,
    label,
    help,
    value: formatValue(cell.v, column.format),
    tone: figureTone(cell, column, reference, colours),
    lines: lines.filter((line) => line !== null),
    better: column.better,
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
      stat.unit,
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

/**
 * '16,2 pour 100 rounds · top ranked 11,4': how often the player dies in the zone on that map, beside
 * top ranked players of his role; null when he has no rounds there.
 */
export function zoneRateLine(zone: DeathZone): string | null {
  if (zone.per100Rounds === null) {
    return null;
  }
  const own = `${formatValue(zone.per100Rounds, 'dec1')} pour 100 rounds`;
  return zone.topPer100Rounds === null
    ? own
    : `${own} · top ranked ${formatValue(zone.topPer100Rounds, 'dec1')}`;
}

/** Whether the player dies in the zone clearly more often than top ranked of his role. */
export function isZoneTooDeadly(zone: DeathZone): boolean {
  return (
    zone.deaths >= ZONE_MIN_DEATHS &&
    zone.per100Rounds !== null &&
    zone.topPer100Rounds !== null &&
    zone.per100Rounds > zone.topPer100Rounds * ZONE_HIGH_RATIO
  );
}

/** One line of the profile list: a radar figure with its value, reference and sample. */
export interface ProfileRow {
  key: string;
  label: string;
  help: string | null;
  /** 1 higher is better, -1 lower is better. */
  better: number;
  value: string;
  tone: CellTone | null;
  /** The reference's value ('200'), or a dash. */
  reference: string;
  /** '423 rounds', or null when unknown. */
  sample: string | null;
}

/**
 * The figures of the profile, in the radar's order: the headline figures of his role, then his
 * opening duels won unless his role already has them (duellists). Each figure is written only here.
 */
export function profileRows(
  headline: readonly HeadlineStat[],
  duels: OpeningDuels,
  reference: Reference,
  colours: boolean,
): ProfileRow[] {
  const figures = headline.map((stat) => ({
    key: stat.key,
    label: stat.label,
    help: stat.help as string | null,
    unit: stat.unit,
    cell: stat.cell,
    column: headlineColumn(stat),
  }));
  if (!headline.some((stat) => stat.key === 'openingWon')) {
    figures.push({
      key: 'duelsWon',
      label: 'Premiers duels gagnés',
      help: 'playerOpeningDuels',
      unit: 'duels',
      cell: duels.duelsWon,
      column: openingColumn('duelsWon', 'Premiers duels gagnés'),
    });
  }
  return figures.map((f) => ({
    key: f.key,
    label: f.label,
    help: f.help,
    better: f.column.better,
    value: formatValue(f.cell.v, f.column.format),
    tone: figureTone(f.cell, f.column, reference, colours),
    reference: formatValue(referenceValue(f.cell, reference).value ?? null, f.column.format),
    sample: f.cell.n ? `${integer(f.cell.n)} ${f.unit}` : null,
  }));
}

/** Matches of the period, led by the last few played before it for context. */
export function formWindow<T extends { inPeriod: boolean }>(
  form: readonly T[],
  context: number,
): T[] {
  const first = form.findIndex((m) => m.inPeriod);
  return first < 0 ? form.slice(-context) : form.slice(Math.max(0, first - context));
}
