import { StatHelp } from './stat-help.model';

/** Ouvertures: what each statistic means, how it is counted and how to read it. */
export const OPENING_HELP: Readonly<Record<string, StatHelp>> = {
  firstBloodRate: {
    title: 'First blood pris',
    what: "Part des rounds où l'escouade fait le premier kill du round.",
    how: "Rounds où le premier kill est fait par l'escouade, divisés par les rounds avec au moins un kill.",
    read: "50 % correspond à un premier duel équilibré ; au-dessus, l'escouade gagne plus souvent l'ouverture.",
  },
  wonAfterFirstBlood: {
    title: 'Rounds gagnés après first blood',
    what: "Part des rounds gagnés quand l'escouade fait le premier kill.",
    how: "Rounds gagnés parmi les rounds où le premier kill est fait par l'escouade.",
    read: "Mesure la conversion d'un 5v4. Une valeur basse signale des throws après l'ouverture.",
  },
  wonAfterFirstDeath: {
    title: 'Rounds gagnés après first death',
    what: "Part des rounds gagnés quand l'escouade subit le premier kill.",
    how: "Rounds gagnés parmi les rounds où le premier kill est subi par l'escouade.",
    read: 'Mesure la capacité à revenir en 4v5.',
  },
  firstDeathRevenge: {
    title: 'First deaths avec revenge',
    what: "Part des first deaths suivies d'une revenge.",
    how: 'First deaths dont le tueur est tué par un coéquipier de la victime dans les 3 secondes, divisées par les first deaths.',
    read: 'Une first death avec revenge ramène le round à 4v4.',
  },
  firstKillTime: {
    title: 'Temps du premier kill',
    what: 'Moment du round où tombe le premier kill.',
    how: "Médiane du temps écoulé depuis le début du round (fin de la phase d'achat) jusqu'au premier kill, en secondes.",
    read: 'Valeur descriptive : un temps court signale un jeu rapide ou des contacts tôt.',
  },
  openingDuels: {
    title: 'Premiers duels',
    what: 'Nombre de rounds avec un premier kill.',
    how: "Rounds de l'escouade contenant au moins un kill.",
    read: "Taille de l'échantillon des autres colonnes.",
  },
  playerFirstBloods: {
    title: 'First bloods',
    what: 'Nombre de premiers kills du round faits par le joueur.',
    how: 'Rounds où le joueur fait le premier kill du round.',
    read: 'Compte brut sur la période.',
  },
  playerFirstDeaths: {
    title: 'First deaths',
    what: 'Nombre de fois où le joueur meurt en premier dans le round.',
    how: 'Rounds où le joueur est la victime du premier kill du round.',
    read: 'Compte brut sur la période.',
  },
  firstBloodNet: {
    title: 'FB - FD',
    what: 'Bilan des premiers duels du joueur.',
    how: 'First bloods moins first deaths sur la période.',
    read: "Positif : le joueur ouvre plus de rounds qu'il n'en offre à l'adversaire.",
  },
  openingDuelsWon: {
    title: 'Premiers duels gagnés',
    what: 'Part des premiers duels gagnés par le joueur quand il y est impliqué.',
    how: 'First bloods divisées par (first bloods + first deaths) du joueur. Référence top ranked : joueurs du même rôle.',
    read: "50 % est l'équilibre ; un duelliste doit viser au-dessus.",
  },
  wonAfterOwnFirstBlood: {
    title: 'Rounds gagnés après sa first blood',
    what: 'Part des rounds gagnés quand ce joueur fait le premier kill.',
    how: 'Rounds gagnés parmi les rounds où le joueur fait la first blood.',
    read: "Mesure si l'équipe convertit les ouvertures de ce joueur.",
  },
  wonAfterOwnFirstDeath: {
    title: 'Rounds gagnés après sa first death',
    what: 'Part des rounds gagnés quand ce joueur meurt en premier.',
    how: 'Rounds gagnés parmi les rounds où le joueur est la first death.',
    read: "Une valeur haute signale des first deaths peu coûteuses (souvent suivies d'une revenge).",
  },
  firstBloodsPerRound: {
    title: 'First bloods par round',
    what: 'Fréquence à laquelle le joueur ouvre le round.',
    how: 'First bloods du joueur divisées par ses rounds joués.',
    read: 'Autour de 0,10 en moyenne, plus haut pour un duelliste.',
  },
  openingWeapons: {
    title: 'Armes des premiers duels',
    what: "Armes avec lesquelles l'escouade gagne et perd les premiers duels.",
    how: 'Les capacités, ultimes et chutes sont regroupés sous « Capacités ». Les armes avec moins de 5 duels sont masquées.',
    read: 'Comparer la part des first bloods et des first deaths de chaque arme.',
  },
  openingWeaponFb: {
    title: 'Part des first bloods',
    what: "Part des first bloods de l'escouade faites avec cette arme.",
    how: "First bloods de l'escouade avec l'arme divisées par toutes ses first bloods.",
    read: "Les parts d'une colonne totalisent 100 %.",
  },
  openingWeaponFd: {
    title: 'Part des first deaths',
    what: "Part des first deaths de l'escouade subies face à cette arme.",
    how: "First deaths de l'escouade dont le tueur utilise l'arme, divisées par toutes ses first deaths.",
    read: "Une part haute face à l'Operator signale des ouvertures prises dans un angle tenu à l'Operator.",
  },
  openingWeaponDuel: {
    title: "Premiers duels gagnés avec l'arme",
    what: "Part des premiers duels gagnés selon l'arme achetée par le joueur.",
    how: "First bloods divisées par (first bloods + first deaths) des joueurs dont l'arme principale achetée au round est cette arme.",
    read: "L'arme achetée n'est pas forcément l'arme en main au moment du duel.",
  },
};
