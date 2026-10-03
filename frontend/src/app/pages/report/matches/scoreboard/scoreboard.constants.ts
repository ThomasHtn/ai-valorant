import { ValueFormat } from '@core/format/value-format.model';
import { ScoreboardLine } from '@core/report/matches.model';

/** A scoreboard column: the field it reads, its header, its format and its "i" topic. */
export interface ScoreboardColumn {
  key: keyof ScoreboardLine;
  label: string;
  format: ValueFormat;
  help: string | null;
}

export const SCOREBOARD_COLUMNS: readonly ScoreboardColumn[] = [
  { key: 'acs', label: 'ACS', format: 'int', help: 'acs' },
  { key: 'kills', label: 'K', format: 'int', help: null },
  { key: 'deaths', label: 'D', format: 'int', help: null },
  { key: 'assists', label: 'A', format: 'int', help: null },
  { key: 'adr', label: 'ADR', format: 'int', help: 'adr' },
  { key: 'kast', label: 'KAST', format: 'pct', help: 'kast' },
  { key: 'headshotRate', label: 'HS', format: 'pct', help: 'headshotRate' },
  { key: 'firstBloods', label: 'FB', format: 'int', help: 'playerFirstBloods' },
  { key: 'firstDeaths', label: 'FD', format: 'int', help: 'playerFirstDeaths' },
];
