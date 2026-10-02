import { StatHelp } from './stat-help.model';

/** How to read the reports: references, colours and the strength of a gap. */
export const READING_HELP = {
  opponents: {
    title: 'Adversaires (même niveau)',
    what: "Les joueurs d'en face dans vos propres matchs, donc au même elo que vous.",
    read: "La référence la plus juste pour savoir si vous faites mieux ou moins bien qu'à votre niveau.",
  },
  topRanked: {
    title: 'Top ranked',
    what: 'Les 20 meilleurs joueurs du leaderboard de chaque région et leurs matchs compétitifs récents.',
    read: "Sert de référence pour les situations de jeu : vos adversaires y seraient le reflet exact de vos chiffres (un duel que vous gagnez est un duel qu'ils perdent).",
  },
  status: {
    title: 'Confirmé ou piste',
    what: "Confirmé : l'écart est trop grand et répété sur trop de rounds pour être de la malchance. Piste : écart à surveiller, qui peut encore être du hasard.",
    how: 'Un test statistique vérifie chaque écart, en tenant compte du grand nombre de stats comparées en même temps.',
  },
  heatColors: {
    title: 'Cases colorées',
    what: "Vert : au-dessus de la référence. Orange : à 3 points près, dans la moyenne. Rouge : en dessous. Plus la couleur est franche, plus l'écart est grand.",
    read: 'Case grisée sans couleur : moins de 5 rounds, trop peu pour conclure. Survoler une case pour le nombre exact de rounds.',
  },
  points: {
    title: 'Écart en points',
    what: 'Différence entre deux pourcentages : passer de 50 % à 53 % fait +3 pts.',
    read: '« net » : changement assez grand pour ne pas être dû au hasard.',
  },
} satisfies Record<string, StatHelp>;
