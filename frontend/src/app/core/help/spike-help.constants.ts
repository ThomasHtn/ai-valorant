import { StatHelp } from './stat-help.model';

/** Spike: what each statistic means, how it is counted and how to read it. */
export const SPIKE_HELP: Readonly<Record<string, StatHelp>> = {
  spikeSitePlants: {
    title: 'Vos plants',
    what: "Sur quel site l'escouade pose le spike quand elle attaque.",
    how: "Rounds d'attaque avec un plant sur ce site, divisés par tous les rounds d'attaque avec un plant sur la carte.",
    read: "Une répartition très déséquilibrée rend l'attaque prévisible.",
  },
  spikePostPlantWon: {
    title: 'Post-plants gagnés',
    what: "Les rounds d'attaque gagnés une fois le spike posé.",
    how: "Rounds d'attaque gagnés avec un plant (sur ce site ou dans cette situation), divisés par les rounds d'attaque avec un plant.",
    read: "Plus c'est haut, mieux l'escouade tient le spike.",
  },
  spikeSiteTaken: {
    title: 'Plants subis',
    what: "Sur quel site les adversaires posent le spike quand l'escouade défend.",
    how: 'Rounds de défense avec un plant adverse sur ce site, divisés par tous les rounds de défense avec un plant adverse sur la carte.',
    read: 'Un site qui reçoit beaucoup de plants est souvent le site le plus faible en défense.',
  },
  spikeRetakeWon: {
    title: 'Retakes réussies',
    what: 'Les rounds de défense gagnés alors que les adversaires ont posé le spike.',
    how: "Rounds de défense gagnés après un plant adverse (sur ce site ou dans cette situation), divisés par les rounds de défense avec un plant adverse. L'écart au plant est vu depuis la défense.",
    read: "Plus c'est haut, mieux l'escouade reprend les sites.",
  },
  spikeDefuses: {
    title: 'Defuses',
    what: "Nombre de spikes désamorcés par l'escouade sur ce site.",
    how: "Rounds de défense avec un plant sur ce site terminés par un defuse de l'escouade, sur la période.",
  },
  spikeAdvAtPlant: {
    title: 'Écart de joueurs au plant',
    what: "Combien de joueurs en plus (ou en moins) l'escouade a au moment où le spike est posé.",
    how: "Joueurs en vie de l'équipe moins joueurs en vie adverses à l'instant du plant, en moyenne sur les rounds avec un plant. Dans le tableau par écart, en infériorité veut dire un écart négatif.",
    read: "Au-dessus de 0, l'escouade plante avec l'avantage numérique.",
  },
  spikePlantRate: {
    title: "Rounds d'attaque avec plant",
    what: "La part des attaques où l'escouade arrive à poser le spike.",
    how: "Rounds d'attaque avec un plant, divisés par les rounds d'attaque hors eco (pistols, force buys et full buys).",
    read: "Plus c'est haut, plus l'attaque arrive jusqu'au site.",
  },
  spikePlantTime: {
    title: 'Temps médian du plant',
    what: "À quel moment du round l'escouade pose le spike en attaque.",
    how: "Médiane du temps du plant, compté depuis la fin de la phase d'achat, sur les rounds d'attaque avec un plant.",
    read: "Ni bon ni mauvais en soi: à comparer avec le top ranked pour voir si l'escouade joue plus lent.",
  },
  spikeTimeout: {
    title: 'Attaques perdues au temps',
    what: "Rounds d'attaque perdus sans avoir posé le spike alors qu'il restait des joueurs en vie.",
    how: "Rounds d'attaque perdus, sans plant, avec au moins un joueur de l'escouade en vie à la fin.",
    read: "Chaque round perdu au temps est un round d'attaque sans exécution.",
  },
  spikeExploded: {
    title: 'Explosions subies en défense',
    what: 'Rounds de défense perdus parce que le spike adverse a explosé.',
    how: 'Rounds de défense terminés par une explosion du spike, sur la période.',
  },
  spikePlayerPlants: {
    title: 'Plants',
    what: 'Nombre de spikes posés par le joueur.',
    how: "Rounds d'attaque où le joueur a posé le spike, sur la période. L'échantillon est le nombre de rounds d'attaque joués.",
  },
  spikePlayerDefuses: {
    title: 'Defuses',
    what: 'Nombre de spikes désamorcés par le joueur.',
    how: "Rounds de défense terminés par un defuse du joueur, sur la période. L'échantillon est le nombre de rounds de défense joués.",
  },
  spikePlanterSurvival: {
    title: 'Survie après son plant',
    what: 'Le joueur qui pose le spike est-il encore en vie à la fin du round.',
    how: 'Rounds où le joueur a posé le spike et a survécu, divisés par les rounds où il a posé le spike. Référence top ranked: joueurs du même rôle.',
    read: 'Le poseur qui survit peut encore jouer le post-plant.',
  },
};
