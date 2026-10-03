import { CompareCohort, CompareMode, CompareSort } from './compare.model';

/** Team selections, as the boxes list them. */
export const COMPARE_COHORTS: Record<CompareCohort, string> = {
  squad: "L'escouade, période du rapport",
  hist: "L'escouade, avant la période",
  opp: 'Adversaires, période du rapport',
  top: 'Top ranked',
};

export const COMPARE_MODES: readonly { mode: CompareMode; label: string }[] = [
  { mode: 'team', label: 'Équipes et périodes' },
  { mode: 'players', label: 'Joueur contre joueur' },
];

/** Rows kept per table in team mode, so a long table does not bury the others. */
export const MAX_ROWS_PER_TABLE = 18;

/** A gap is coloured only when its p-value is under this level. */
export const SIGNIFICANCE_LEVEL = 0.05;

/** Orders of the lines, as the sort switch lists them. */
export const COMPARE_SORTS: readonly { sort: CompareSort; label: string }[] = [
  { sort: 'tables', label: 'Par thème' },
  { sort: 'gap', label: 'Plus gros écart' },
];

/** Title of the single list the "Plus gros écart" order builds. */
export const SORTED_GROUP_TITLE = 'Toutes les stats, du plus gros écart au plus petit';
