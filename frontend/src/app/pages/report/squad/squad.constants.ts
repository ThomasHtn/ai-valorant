import { VerdictKey } from './squad.model';

/** Sections of the Escouade page, in order, for the sticky section bar. */
export const SQUAD_SECTIONS: readonly { id: string; label: string }[] = [
  { id: 'squad-priorities', label: 'Priorités' },
  { id: 'squad-strengths', label: 'Ce qui marche' },
  { id: 'squad-maps', label: 'Cartes' },
  { id: 'squad-economy', label: 'Économie' },
  { id: 'squad-opening', label: 'Ouvertures' },
  { id: 'squad-post-plant', label: 'Post-plant' },
  { id: 'squad-retakes', label: 'Retakes' },
  { id: 'squad-roster', label: 'Effectif' },
];

/** Words of a map verdict and their colour classes. */
export const VERDICTS: Record<VerdictKey, { label: string; tone: string }> = {
  solid: { label: 'Solide', tone: 'text-rating-good' },
  stabilize: { label: 'À stabiliser', tone: 'text-rating-average' },
  work: { label: 'À travailler', tone: 'text-rating-bad' },
  test: { label: 'À tester', tone: 'text-text-muted' },
  collecting: { label: 'Collecte en cours', tone: 'text-text-muted' },
};

/** Priorities and strengths quoted in the conclusion. */
export const LEAD_PRIORITIES = 3;
export const LEAD_STRENGTHS = 2;

/** Under this many pistols the pistol figure stays grey (two per match). */
export const MIN_PISTOLS = 6;
