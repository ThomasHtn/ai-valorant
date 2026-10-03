import { StatHelp } from './stat-help.model';

/** Utilitaire: what each statistic means, how it is counted and how to read it. */
export const UTILITY_HELP: Readonly<Record<string, StatHelp>> = {
  utilityPerRound: {
    title: 'Compétences par round',
    what: 'Combien de fois le joueur utilise chaque compétence par round avec cet agent.',
    how: "Nombre d'utilisations de la compétence sur le match divisé par les rounds du match, cumulé sur la période (C, Q et E selon les touches par défaut). Référence top ranked: le même agent.",
    read: "Henrik ne donne que le total par match: impossible de savoir dans quels rounds l'utilitaire a servi.",
  },
  utilityUltPerMatch: {
    title: 'Ultimes par match',
    what: "Combien d'ultimes le joueur lance par match avec cet agent.",
    how: "Nombre d'ultimes lancés divisé par le nombre de matchs joués avec l'agent. Référence top ranked: le même agent.",
  },
  utilityTotalPerRound: {
    title: 'Total par round',
    what: 'Toutes les compétences utilisées par round, ultime compris.',
    how: 'Somme des utilisations C, Q, E et X sur le match divisée par les rounds du match, cumulée sur la période. Référence top ranked: le même agent.',
  },
  utilityKills: {
    title: "Kills à l'utilitaire",
    what: "Les kills faits avec une compétence plutôt qu'une arme.",
    how: "Kills sur des adversaires dont l'arme est une compétence, y compris les kills sans nom d'arme (Headhunter et Tour De Force de Chamber, ultime de Neon).",
  },
  utilityKillShare: {
    title: 'Part des kills',
    what: 'La part des kills du joueur faits avec une compétence.',
    how: "Kills à l'utilitaire divisés par tous les kills sur des adversaires. Référence top ranked: joueurs du même rôle.",
  },
  utilityTeamPerRound: {
    title: 'Compétences par round',
    what: "Combien de compétences l'équipe entière utilise par round, selon que le match est gagné ou perdu.",
    how: 'Somme des utilisations C, Q et E des 5 joueurs divisée par les rounds, sur les matchs gagnés puis sur les matchs perdus. Seul le total par match est disponible: la comparaison par round gagné ou perdu est impossible.',
    read: 'Dépend beaucoup de la composition: à lire comme une tendance.',
  },
  utilityTeamUltPerMatch: {
    title: 'Ultimes par match',
    what: "Combien d'ultimes l'équipe lance par match.",
    how: 'Somme des ultimes lancés par les 5 joueurs divisée par le nombre de matchs, sur les matchs gagnés puis sur les matchs perdus.',
  },
};
