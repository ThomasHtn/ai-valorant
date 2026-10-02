import { StatHelp } from './stat-help.model';

/** How to read the reports: references, colours and the strength of a gap. */
export const READING_HELP = {
  opponents: {
    title: 'Adversaire',
    what: "Les joueurs d'en face dans vos matchs, donc à votre elo.",
    read: 'La comparaison la plus juste pour savoir si vous jouez au-dessus ou en dessous de votre rang.',
  },
  topRanked: {
    title: 'Top ranked',
    what: 'Le top 20 du leaderboard de chaque région, sur leurs dernières ranked.',
    read: "Le niveau à viser. Pour les situations de jeu (3v2, retake, clutch...), c'est la seule comparaison possible : un clutch que vous gagnez, c'est un clutch que vos adversaires perdent, se comparer à eux ne voudrait rien dire.",
  },
  sameLevel: {
    title: 'Adversaire',
    what: 'Vos adversaires dans ces mêmes matchs : des joueurs de votre elo.',
    read: "Pour un pourcentage de rounds gagnés ou de first bloods, l'adversaire fait toujours l'inverse de vous : la référence est alors 50 %.",
  },
  status: {
    title: 'Écart net ou à confirmer',
    what: 'Écart net : il revient sur assez de rounds pour ne pas être de la chance. À confirmer : à surveiller, ça peut encore être un coup de chance ou de malchance.',
    how: 'Chaque écart passe un test statistique. Comme on compare beaucoup de stats à la fois, le test est plus sévère pour éviter les fausses alertes.',
  },
  heatColors: {
    title: 'Cases colorées',
    what: "Vert : mieux que la référence. Orange : à 3 points près, dans la moyenne. Rouge : moins bien. Plus la couleur est vive, plus l'écart est grand.",
    read: 'Case grise : moins de 5 rounds, pas assez pour conclure. Passez la souris sur une case pour voir le nombre de rounds.',
  },
  roundsGap: {
    title: 'Écart en rounds',
    what: 'Les rounds gagnés en plus ou en moins que si vous gagniez aussi souvent que le top ranked, sur le même nombre de rounds.',
    example: {
      text: '16 retakes à jouer, le top ranked en gagne 29 % : environ 5. Vous en gagnez 0, soit -5 rounds.',
    },
  },
  points: {
    title: 'Écart en points',
    what: 'La différence entre deux pourcentages : de 50 % à 53 %, ça fait +3 pts.',
    read: '« net » : écart assez grand pour ne pas être du hasard.',
  },
} satisfies Record<string, StatHelp>;
