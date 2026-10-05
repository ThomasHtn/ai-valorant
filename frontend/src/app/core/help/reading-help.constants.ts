import { StatHelp } from './stat-help.model';

/** Lecture des chiffres: what each statistic means, how it is counted and how to read it. */
export const READING_HELP: Readonly<Record<string, StatHelp>> = {
  reference: {
    title: 'Référence',
    what: "Chaque chiffre de l'escouade est comparé au top ranked dans la même situation : les meilleurs joueurs classés, EU en priorité. Pour un joueur, au top ranked de son rôle.",
    how: 'Matchs top ranked du même patch que la période (complétés par le patch précédent tant que le nouveau en compte moins de 700), sur les cartes du map pool en cours. Comparer permet aussi de se mesurer aux adversaires ou à son propre passé.',
    read: 'Vert : mieux que le top ranked. Orange : à moins de 3 points (5 % pour une moyenne). Rouge : moins bien. Gris : échantillon trop petit.',
  },
  dataQuality: {
    title: 'Données',
    what: 'Sur quoi reposent les chiffres affichés.',
    how: "Matchs Henrik de l'escouade en 5-stack, rechargés chaque nuit ; top ranked collecté chaque nuit jusqu'à 400 matchs par carte et par patch, gardé sur le patch en cours et le précédent.",
  },
  detections: {
    title: 'Alertes automatiques',
    what: "Ce que l'outil repère seul dans les données de la période, sans interprétation.",
    how: 'Répétitions sur plusieurs matchs et liens entre deux chiffres. Chaque ligne donne son échantillon et ses rounds. Les écarts testés sont dans Points forts et faibles.',
  },
  detRepeat: {
    title: 'Ce qui se répète',
    what: 'Une même situation qui revient sur plusieurs matchs : first deaths au même endroit, même situation perdue.',
    how: "4 fois ou plus, sur au moins 2 matchs. Une zone de first deaths n'apparaît que si l'escouade y meurt en premier au moins 5 points plus souvent que le top ranked : sinon c'est le point de contact habituel de la carte.",
  },
  detLink: {
    title: 'Liens entre chiffres',
    what: 'Comment le résultat du round change selon ce que fait un joueur.',
    how: "Rounds gagnés après la first death ou le first blood de chaque joueur, comparés à la moyenne de l'escouade.",
  },
  findingStatus: {
    title: 'Écart net, à confirmer',
    what: "Un point fort ou faible n'est affiché que si l'écart avec la référence a peu de chances d'être dû au hasard.",
    how: 'Test de proportions sur chaque chiffre, puis correction de Benjamini-Hochberg sur tous les tests de la période. Écart net : passe la correction. À confirmer : passe le test seul (p < 0,05).',
    read: "Adversaires pour le jeu d'équipe (mêmes matchs, même niveau), top ranked pour la méta (économie, plants, timings).",
  },
};
