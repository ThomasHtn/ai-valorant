import { StatHelp } from './stat-help.model';

/** Revenge et espacement: what each statistic means, how it is counted and how to read it. */
export const REVENGE_HELP: Readonly<Record<string, StatHelp>> = {
  deathRevenge: {
    title: 'Morts avec revenge',
    what: "Part des morts suivies d'une revenge par un coéquipier.",
    how: 'Morts dont le tueur est tué par un coéquipier de la victime dans les 3 secondes, divisées par les morts (suicides et kills alliés exclus).',
    read: "Plus haut = mieux : la mort est rendue tout de suite et le round reste équilibré. Un 5-stack joue plus groupé que des adversaires en solo queue : un avantage ici face aux adversaires est attendu, il ne vaut un point fort que s'il tient aussi face au top ranked.",
  },
  revengesGiven: {
    title: 'Revenges données',
    what: 'Fréquence à laquelle le joueur venge un coéquipier.',
    how: "Kills qui tuent le tueur d'un coéquipier dans les 3 secondes suivant sa mort, divisés par les rounds joués.",
  },
  revengeDelay: {
    title: 'Temps avant la revenge',
    what: 'Délai entre la mort et la revenge.',
    how: 'Médiane, sur les morts avec revenge, du temps entre la mort et le kill du tueur, en secondes (3 s maximum par définition).',
    read: "Plus court = mieux : le coéquipier était déjà prêt à reprendre l'angle.",
  },
  isolatedDeaths: {
    title: 'Morts isolées',
    what: 'Part des morts sans coéquipier à proximité.',
    how: "Morts où aucun coéquipier vivant n'est à moins de 15 m de la victime, divisées par les morts où au moins un coéquipier est encore vivant.",
    read: 'Plus bas = mieux : une mort isolée ne peut presque jamais recevoir de revenge. Comme pour la revenge, un 5-stack part avantagé face à des adversaires en solo queue.',
  },
  nearestMate: {
    title: 'Coéquipier le plus proche',
    what: 'Distance au coéquipier vivant le plus proche au moment de la mort.',
    how: 'Médiane, sur les morts où au moins un coéquipier est vivant, de la distance entre la victime et le coéquipier le plus proche, en mètres.',
    read: 'Plus bas = mieux pour la revenge ; trop bas expose à deux kills sur le même spray.',
  },
  doublePeek: {
    title: 'Morts groupées sans revenge',
    what: 'Part des morts où deux joueurs tombent au même endroit sans revenge.',
    how: "Morts sans revenge suivies ou précédées, à 5 secondes près, d'une autre mort sans revenge d'un coéquipier dans la même zone de la carte, divisées par les morts.",
    read: 'Plus bas = mieux : signale des peeks à deux mal synchronisés ou un deuxième joueur qui rejoint un duel déjà perdu.',
  },
  teamSpread: {
    title: "Écartement de l'équipe",
    what: "Distance moyenne entre les joueurs vivants de l'équipe pendant les combats.",
    how: "À chaque kill du match, moyenne des distances entre toutes les paires de joueurs vivants de l'équipe (2 vivants minimum), puis moyenne sur tous les kills, en mètres.",
    read: "Valeur descriptive. Pas de référence top ranked (positions non conservées) : comparer à l'historique ou aux adversaires.",
  },
  revengeMatrix: {
    title: 'Qui venge qui',
    what: 'Nombre de revenges entre chaque paire de joueurs.',
    how: "Pour chaque mort d'un joueur (ligne), le coéquipier qui tue son tueur dans les 3 secondes (colonne).",
    read: 'Montre les binômes qui jouent ensemble et les joueurs que personne ne couvre.',
  },
  duoRounds: {
    title: 'Rounds ensemble',
    what: 'Rounds joués par les deux joueurs dans la même équipe.',
    how: "Rounds de la période où les deux joueurs sont dans l'équipe.",
  },
  duoRoundsWon: {
    title: 'Rounds gagnés ensemble',
    what: 'Part des rounds gagnés quand les deux joueurs jouent ensemble.',
    how: 'Rounds gagnés divisés par les rounds joués ensemble. Référence : le même duo avant la période.',
  },
  duoRevenges: {
    title: 'Revenges entre eux',
    what: "Revenges faites par l'un pour l'autre.",
    how: "Morts de l'un suivies d'une revenge de l'autre dans les 3 secondes, dans les deux sens ; aussi ramené à 100 rounds joués ensemble.",
  },
};
