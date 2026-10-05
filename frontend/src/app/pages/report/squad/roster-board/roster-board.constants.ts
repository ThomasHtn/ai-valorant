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

/** Columns of the roster, each coloured against the top ranked. */
export const ROSTER_COLUMNS = {
  acs: column('acs', 'ACS', 'int', 'acs'),
  adr: column('adr', 'ADR', 'int', 'adr'),
  kast: column('kast', 'KAST', 'pct', 'kast'),
  headshots: column('headshots', 'HS', 'pct', 'headshotRate'),
  opening: column('opening', 'Premier duel', 'pct', 'playerOpeningDuels'),
  traded: column('traded', 'Revenge', 'pct', 'deathsRevenged'),
} as const;

export type RosterKey = keyof typeof ROSTER_COLUMNS;

/** What each column's sample counts, written in its tip ('sur 189 duels'). */
export const ROSTER_SAMPLES: Record<RosterKey, string> = {
  acs: 'rounds',
  adr: 'rounds',
  kast: 'rounds',
  headshots: 'tirs touchés',
  opening: 'duels',
  traded: 'morts',
};

/** Grid columns: player, ACS chart, five figures, opening duels, revenge. */
export const ROSTER_GRID =
  'minmax(12rem,1.6fr) 7.5rem repeat(5,minmax(4.25rem,1fr)) minmax(6rem,1.2fr) minmax(4.25rem,1fr)';

/** Opening duels under this many stay grey; within 3 points of even they stay white. */
export const OPENING_MIN_DUELS = MIN_PLAYER_ROUNDS;
export const OPENING_EVEN_BAND = 0.03;
