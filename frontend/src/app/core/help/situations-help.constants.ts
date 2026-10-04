import { StatHelp } from './stat-help.model';

/** Situations: what each statistic means, how it is counted and how to read it. */
export const SITUATIONS_HELP: Readonly<Record<string, StatHelp>> = {
  xvyReach: {
    title: 'Rounds où la situation arrive',
    what: 'Part des rounds qui passent par ce nombre de joueurs vivants.',
    how: "Rounds où, à un moment, l'escouade a X joueurs vivants contre Y adversaires, divisés par tous les rounds.",
    read: 'Valeur descriptive : un round passe par plusieurs situations.',
  },
  xvyWon: {
    title: 'Rounds gagnés par situation',
    what: "Part des rounds gagnés quand l'escouade passe par cette situation.",
    how: "Rounds gagnés parmi les rounds où l'escouade a X vivants contre Y adversaires à un moment du round. Vivants comptés à chaque kill (les résurrections sont prises en compte).",
    read: "Comparer au top ranked : un 5v4 se gagne environ 7 fois sur 10. Les situations à égalité (3v3) sont comparées à l'historique : le top ranked y est toujours à 50 %.",
  },
  reachPlus2: {
    title: 'Rounds avec +2 joueurs',
    what: "Part des rounds où l'escouade a au moins 2 joueurs vivants de plus.",
    how: "Rounds où l'écart de vivants atteint +2 ou plus à un moment, divisés par tous les rounds.",
  },
  throws: {
    title: 'Throws',
    what: 'Part des rounds perdus après avoir eu 2 joueurs vivants de plus.',
    how: "Rounds perdus parmi les rounds où l'écart de vivants atteint +2 ou plus.",
    read: 'Plus bas = mieux.',
  },
  reachMinus2: {
    title: 'Rounds avec -2 joueurs',
    what: "Part des rounds où l'escouade a au moins 2 joueurs vivants de moins.",
    how: "Rounds où l'écart de vivants atteint -2 ou moins à un moment, divisés par tous les rounds.",
  },
  comebacks: {
    title: 'Comebacks',
    what: 'Part des rounds gagnés après avoir eu 2 joueurs vivants de moins.',
    how: "Rounds gagnés parmi les rounds où l'écart de vivants atteint -2 ou moins.",
  },
  advantageTime: {
    title: 'Temps en avantage',
    what: "Part du temps de round passé avec plus (ou moins) de joueurs vivants que l'adversaire.",
    how: 'Durée avec un écart de vivants positif (ou négatif), divisée par la durée totale, du début du round au dernier kill, plant ou defuse.',
    read: "Le temps après le dernier événement (fin du timer du spike) n'est pas compté.",
  },
  clutch: {
    title: 'Clutch',
    what: 'Round où le joueur se retrouve dernier vivant de son équipe face à au moins un adversaire.',
    how: "La taille (1v1 à 1v5) est le nombre d'adversaires vivants au moment où le joueur devient le dernier vivant. Le clutch est gagné si l'équipe gagne le round.",
    read: 'Un 1v1 se gagne environ 6 fois sur 10 au top ranked (le joueur qui se retrouve seul en dernier fait souvent face à un adversaire déjà blessé). Les 1v4 et 1v5 sont presque toujours perdus.',
  },
  clutchRate: {
    title: 'Rounds finis en clutch',
    what: 'Part des rounds où le joueur se retrouve dernier vivant face à des adversaires.',
    how: 'Rounds avec un clutch du joueur divisés par ses rounds joués.',
    read: "Valeur descriptive : dépend du rôle et de l'ordre dans lequel l'équipe meurt.",
  },
  aliveMatrix: {
    title: 'Matrice des vivants',
    what: 'Part des rounds gagnés selon le nombre de joueurs vivants de chaque côté.',
    how: 'Pour chaque situation X vivants contre Y adversaires, rounds gagnés parmi les rounds qui passent par cette situation.',
    read: "La case 5 contre 5 est le taux de rounds gagnés global. Les cases à égalité sont comparées à l'historique.",
  },
};
