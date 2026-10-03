import { StatHelp } from './stat-help.model';

/** Comportement: what each statistic means, how it is counted and how to read it. */
export const BEHAVIOR_HELP: Readonly<Record<string, StatHelp>> = {
  behavior: {
    title: 'Comportement',
    what: 'Les signaux de comportement que le jeu enregistre pour chaque joueur.',
    how: 'Valeurs fournies par le jeu, additionnées sur les matchs de la période.',
  },
  afkRounds: {
    title: 'Rounds inactifs',
    what: 'Le nombre de rounds où le jeu a considéré le joueur comme inactif.',
    how: 'Rounds où le jeu marque le joueur comme inactif (indicateur par round), sur la période.',
  },
  penalties: {
    title: 'Pénalités',
    what: 'Le nombre de rounds où le joueur a reçu une pénalité du jeu.',
    how: "Rounds marqués avec une pénalité reçue (souvent liée à l'inactivité ou au friendly fire).",
  },
};
