import { Reference } from '@core/common/enums.model';
import { ValueFormat } from '@core/format/value-format.model';
import { formatValue, integer } from '@core/format/value-format.utils';
import { AgentRole } from '@core/game-assets/game-assets.model';
import { ROLE_LABELS } from '@core/game-assets/game-assets.constants';
import { ClutchLine, DeathZone, HeadlineStat, OpeningDuels } from '@core/report/players.model';
import { StatCell, StatColumn } from '@core/report/stat-table.model';
import { cellTone } from '@core/report/tone.utils';
import { CellTone } from '@core/report/tone.model';

import { PlayerFigure } from './players-figure.model';
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

/** Tone of a figure against the reference, like a table cell. */
export function figureTone(
  cell: StatCell | undefined,
  column: StatColumn,
  reference: Reference,
): CellTone | null {
  return cellTone(cell, column, reference);
}

/** A headline figure of the API as a player figure. */
export function headlineFigure(stat: HeadlineStat): PlayerFigure {
  return {
    key: stat.key,
    label: stat.label,
    help: stat.help || null,
    format: stat.format,
    better: stat.better,
    min: stat.min,
    unit: stat.unit || null,
    cell: stat.cell,
  };
}

/** Rounds won after his first bloods and after his first deaths, with a player's smaller minimum. */
export function openingFigures(duels: OpeningDuels): PlayerFigure[] {
  const figure = (key: string, label: string, help: string, cell: StatCell): PlayerFigure => ({
    key,
    label,
    help,
    format: 'pct',
    better: 1,
    min: PANEL_MIN_SAMPLE,
    unit: 'rounds',
    cell,
  });
  return [
    figure(
      'afterFb',
      'Round gagné après sa first blood',
      'wonAfterFirstBlood',
      duels.wonAfterFirstBlood,
    ),
    figure(
      'afterFd',
      'Round gagné après sa first death',
      'wonAfterFirstDeath',
      duels.wonAfterFirstDeath,
    ),
  ];
}

/** One figure per clutch size ('Clutchs 1v2 gagnés'); the sample is written by `clutchSample`. */
export function clutchFigures(lines: readonly ClutchLine[]): PlayerFigure[] {
  return lines.map((line) => ({
    key: `clutch-${line.situation}`,
    label: `Clutchs ${line.situation} gagnés`,
    help: null,
    format: 'pct',
    better: 1,
    min: CLUTCH_MIN_SAMPLE,
    unit: null,
    cell: line.cell,
  }));
}

/** '2 gagnés sur 5' under a clutch bar. */
export function clutchSample(line: ClutchLine): string {
  return `${integer(line.won)} gagné${line.won > 1 ? 's' : ''} sur ${integer(line.played)}`;
}

/** Economy figures write their means in credits ('3 989 crédits'), their rates as they are. */
export function economyFormat(figure: PlayerFigure): ValueFormat {
  return figure.format === 'int' ? 'cr' : figure.format;
}

/**
 * '16 morts pour 100 rounds sur Summit, top ranked 11': how often the player dies in the zone on that
 * map, beside top ranked players of his role; null when he has no rounds there.
 */
export function zoneRateLine(zone: DeathZone): string | null {
  if (zone.per100Rounds === null) {
    return null;
  }
  const own = `${formatValue(zone.per100Rounds, 'int')} morts pour 100 rounds sur ${zone.mapName}`;
  return zone.topPer100Rounds === null
    ? own
    : `${own}, top ranked ${formatValue(zone.topPer100Rounds, 'int')}`;
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
