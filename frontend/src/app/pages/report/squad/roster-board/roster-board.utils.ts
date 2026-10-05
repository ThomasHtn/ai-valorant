import { formatValue } from '@core/format/value-format.utils';
import { RosterLine } from '@core/report/squad.model';
import { StatColumn } from '@core/report/stat-table.model';
import { CellTone } from '@core/report/tone.model';
import { cellTone } from '@core/report/tone.utils';
import { HoverTipContent } from '@shared/hover-tip/hover-tip.model';

import { DashTone, RosterCell, RosterRow } from '../squad.model';
import { rosterTip } from '../tips.utils';
import {
  OPENING_EVEN_BAND,
  OPENING_MIN_DUELS,
  ROSTER_COLUMNS,
  ROSTER_SAMPLES,
  RosterKey,
} from './roster-board.constants';

/** The table tone of a roster cell in dashboard terms: orange (even) reads white. */
const TONES: Record<CellTone, DashTone> = { good: 'good', bad: 'bad', avg: 'flat', small: 'thin' };

/** Players by ACS, each figure against the top ranked; `months` labels the ACS chart's points. */
export function rosterRows(roster: readonly RosterLine[], months: readonly string[]): RosterRow[] {
  return [...roster]
    .sort((a, b) => Number(b.acs.v ?? 0) - Number(a.acs.v ?? 0))
    .map((line) => ({
      name: line.name,
      portrait: line.portrait,
      matches: line.matches,
      acsMonths: line.acsMonths,
      acsTop: typeof line.acs.top === 'number' ? line.acs.top : null,
      acsTip: acsTip(line, months),
      cells: [
        ...(['acs', 'adr', 'kast', 'headshots', 'opening'] as const).map((key) =>
          figure(line, ROSTER_COLUMNS[key]),
        ),
        openingDuels(line),
        figure(line, ROSTER_COLUMNS.traded),
      ],
    }));
}

function figure(line: RosterLine, column: StatColumn): RosterCell {
  const cell = line[column.key as RosterKey];
  const value = typeof cell.v === 'number' ? cell.v : null;
  const tone = cellTone(cell, column, 'top');
  return {
    key: column.key,
    text: formatValue(value, column.format),
    tone: tone ? TONES[tone] : 'flat',
    tip: rosterTip(line.name, cell, column, ROSTER_SAMPLES[column.key as RosterKey]),
  };
}

/** ACS of every month of the chart, then the top ranked of the dashed line. */
export function acsTip(line: RosterLine, months: readonly string[]): HoverTipContent {
  const lines = line.acsMonths.map((value, i) => ({
    label: months[i] ?? '',
    value: value === null ? 'Pas joué' : formatValue(value, 'int'),
  }));
  const top = line.acs.top;
  if (typeof top === 'number') {
    lines.push({ label: 'Top ranked', value: formatValue(top, 'int') });
  }
  return { title: `ACS de ${line.name}`, lines, note: 'Pointillé : ACS du top ranked.' };
}

/** First bloods / first deaths, '105 / 84': green when he wins more than he loses, red the other way. */
export function openingDuels(line: RosterLine): RosterCell {
  const [bloods, deaths] = line.openingRecord.split('-').map(Number);
  const known = Number.isFinite(bloods) && Number.isFinite(deaths);
  return {
    key: 'duels',
    text: known ? `${bloods} / ${deaths}` : '–',
    tone: known ? duelTone(bloods, deaths) : 'thin',
    tip: {
      title: "Duels d'ouverture",
      text: `Premiers duels du round joués par ${line.name}.`,
      lines: known
        ? [
            { label: 'Duels', value: String(bloods + deaths) },
            { label: 'First bloods', value: String(bloods) },
            { label: 'First deaths', value: String(deaths) },
          ]
        : [],
    },
  };
}

function duelTone(bloods: number, deaths: number): DashTone {
  const duels = bloods + deaths;
  if (duels < OPENING_MIN_DUELS) {
    return 'thin';
  }
  const share = bloods / duels - 0.5;
  if (Math.abs(share) < OPENING_EVEN_BAND) {
    return 'flat';
  }
  return share > 0 ? 'good' : 'bad';
}
