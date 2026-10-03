import { CompareCohort, CompareMode } from './compare.model';

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
