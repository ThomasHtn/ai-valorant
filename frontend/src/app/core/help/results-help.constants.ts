import { StatHelp } from './stat-help.model';

/** Résultats: what each statistic means, how it is counted and how to read it. */
export const RESULTS_HELP: Readonly<Record<string, StatHelp>> = {
  roundsWon: {
    title: 'Rounds gagnés',
    what: "Part des rounds joués que l'escouade gagne.",
    how: 'Rounds gagnés divisés par rounds joués.',
    read: "Comparé à l'escouade avant la période : le top ranked et les adversaires seraient toujours à 50 % ou au miroir.",
  },
  roundDiff: {
    title: 'Écart moyen au score',
    what: 'Différence moyenne entre rounds gagnés et rounds perdus dans un match.',
    how: 'Rounds gagnés moins rounds perdus, moyenne par match.',
    read: "+2 veut dire qu'un match finit en moyenne autour de 13-11.",
  },
  sideRounds: {
    title: 'Rounds gagnés par side',
    what: 'Part des rounds gagnés en attaque ou en défense.',
    how: 'Rounds gagnés du side divisés par rounds joués de ce side.',
    read: 'Sur une carte qui avantage la défense, le top ranked gagne aussi moins en attaque.',
  },
  pistols: {
    title: 'Pistols gagnés',
    what: 'Part des pistol rounds gagnés (rounds 1 et 13).',
    how: 'Pistols gagnés divisés par pistols joués.',
  },
  flawless: {
    title: 'Rounds parfaits',
    what: 'Rounds gagnés sans perdre un seul joueur.',
    how: "Rounds gagnés avec 0 mort dans l'escouade divisés par rounds joués.",
  },
  roundTypes: {
    title: 'Types de round',
    what: "Rounds gagnés selon l'achat de l'escouade et le moment du match.",
    how: "Eco : valeur moyenne de l'équipement sous 1 500 crédits. Full buy : 3 700 crédits ou plus. Force buy : entre les deux. R3 bonus : round 3 ou 15 après avoir gagné le pistol et le R2.",
    read: "Le bonus round se joue souvent en force buy contre une équipe qui eco : le top ranked le gagne près d'une fois sur deux.",
  },
  roundContext: {
    title: 'Déroulé du match',
    what: 'Rounds gagnés selon le score et le résultat des rounds précédents.',
    how: 'Chaque round est classé selon le score juste avant lui et la série de rounds qui le précède.',
  },
  roundEnd: {
    title: 'Fin de round',
    what: "Comment se terminent les rounds que l'escouade gagne et perd.",
    how: 'Élimination, explosion du spike, defuse, ou temps écoulé sans plant.',
  },
};
