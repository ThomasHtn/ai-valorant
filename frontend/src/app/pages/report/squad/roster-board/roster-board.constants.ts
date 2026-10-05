import { StatColumn } from '@core/report/stat-table.model';

/** Player rounds under which a roster cell stays grey (the tables' MIN_PLAYER_SAMPLE). */
const MIN_PLAYER_ROUNDS = 10;

const column = (
  key: string,
  label: string,
  format: StatColumn['format'],
  help: string,
): StatColumn => ({
  key,
  label,
  format,
  better: 1,
  help,
  min: MIN_PLAYER_ROUNDS,
  ref: 'top',
});

/** Columns of the roster, each coloured against the top ranked of the player's role. */
export const ROSTER_COLUMNS = {
  acs: column('acs', 'ACS', 'int', 'acs'),
  adr: column('adr', 'ADR', 'int', 'adr'),
  kast: column('kast', 'KAST', 'pct', 'kast'),
  headshots: column('headshots', 'Tête', 'pct', 'headshotRate'),
  opening: column('opening', 'Premier duel', 'pct', 'playerOpeningDuels'),
  traded: column('traded', 'Morts tradées', 'pct', 'deathsRevenged'),
} as const;

export type RosterKey = keyof typeof ROSTER_COLUMNS;
