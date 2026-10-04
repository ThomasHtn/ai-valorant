/** Tables and columns the summary takes from the Tableaux domains, by API id and column key. */
export const SUMMARY_TABLES = {
  maps: 'results-maps',
  roundTypes: 'results-round-types',
  players: 'combat-players',
} as const;

/** Headline tiles read on the "Toutes les cartes" row of the maps table. */
export const HEADLINE_MAP_COLUMNS = ['rw', 'diff', 'att', 'def', 'pistol'] as const;

/** What the sample of each headline tile counts ('Sur 576 rounds', 'Sur 27 matchs'). */
export const HEADLINE_UNITS: Record<string, string> = {
  rw: 'rounds',
  diff: 'matchs',
  att: 'rounds',
  def: 'rounds',
  pistol: 'pistols',
  fullbuy: 'rounds',
};

/** Round type row shown as a headline tile beside the map figures. */
export const HEADLINE_ROUND_TYPE = 'Full buy contre full buy';

/** Columns of the summary's maps and players tables, in display order; few so they fit half a screen. */
export const MAP_COLUMNS = ['wl', 'rw', 'diff'] as const;
export const PLAYER_COLUMNS = ['acs', 'kd', 'adr', 'kast'] as const;

/** Weaknesses and strengths listed in the summary, the costliest in rounds first. */
export const SUMMARY_WEAKNESSES = 5;
export const SUMMARY_STRENGTHS = 3;
