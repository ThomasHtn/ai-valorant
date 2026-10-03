import { StatHelp } from './stat-help.model';

/** Joueurs: what each statistic means, how it is counted and how to read it. */
export const PLAYERS_HELP: Readonly<Record<string, StatHelp>> = {
  hs: {
    title: 'HS',
    what: 'La part des balles qui touchent la tête.',
    how: 'Balles à la tête / balles qui touchent (tête, corps, jambes).',
  },
  fbfdPerRound: {
    title: 'FB-FD par round',
    what: 'Le solde entre first bloods faits et first deaths subies, ramené au round.',
    how: '(First bloods - first deaths) / rounds joués. Référence : joueurs du même rôle.',
    read: "Positif : le joueur ouvre plus de rounds qu'il n'en offre à l'adversaire.",
  },
  deathsRevenged: {
    title: 'Morts avec revenge',
    what: 'La part des morts du joueur où un coéquipier tue son tueur juste après.',
    how: "Morts suivies d'une revenge (le tueur meurt sous les coups d'un coéquipier dans les 3 secondes) / morts.",
    read: "Plus c'est haut, plus le joueur meurt à portée de ses coéquipiers.",
  },
  fdPerRound: {
    title: 'First deaths par round',
    what: 'La fréquence à laquelle le joueur est le premier mort du round.',
    how: 'First deaths / rounds joués.',
    read: "Plus c'est bas, mieux c'est, sauf pour un duelliste qui ouvre les sites.",
  },
  playerOpeningDuels: {
    title: "Duels d'ouverture",
    what: "Les first bloods et first deaths du joueur et ce que l'équipe en fait.",
    how: 'Taux = first bloods / (first bloods + first deaths). Après first blood : rounds gagnés quand il fait le first blood. Après first death : rounds gagnés quand il est le premier mort.',
  },
  playerClutches: {
    title: 'Clutchs',
    what: 'Les rounds où le joueur se retrouve dernier en vie face à un ou plusieurs adversaires.',
    how: 'Situation au moment où il devient le dernier en vie de son équipe ; clutch gagné = round gagné.',
  },
  playerWeapons: {
    title: 'Armes',
    what: 'Les 5 armes avec lesquelles le joueur fait le plus de kills.',
    how: 'HS = balles à la tête / balles qui touchent, sur les victimes tuées avec cette arme dans le round. Distance médiane des kills en mètres.',
  },
  playerDeathZones: {
    title: 'Zones de mort',
    what: 'Les 6 zones où le joueur meurt le plus, par carte.',
    how: 'Zone = callout le plus proche de la position de la victime. Part des first deaths = first deaths dans la zone / morts dans la zone.',
  },
  playerForm: {
    title: 'Forme',
    what: "Les matchs du joueur dans l'ordre chronologique, de mai à aujourd'hui.",
    how: "ACS du match = score de combat / rounds du match. Seuls les matchs joués à 5 avec l'escouade sont comptés.",
  },
  playerRewatch: {
    title: 'Rounds à revoir',
    what: 'Les derniers rounds de la période où le joueur est mort en premier sans revenge.',
    how: 'First deaths du joueur sans revenge dans les 3 secondes, les 8 plus récentes.',
  },
};
