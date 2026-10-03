import { StatHelp } from './stat-help.model';

/** Contexte: what each statistic means, how it is counted and how to read it. */
export const CONTEXT_HELP: Readonly<Record<string, StatHelp>> = {
  lineups: {
    title: 'Résultats par lineup',
    what: "Les résultats de chaque groupe de 5 joueurs de l'escouade.",
    how: "Un lineup = les 5 joueurs de l'escouade présents dans le match. Libellé : le joueur absent.",
  },
  withWithout: {
    title: 'Avec ou sans chaque joueur',
    what: 'Les rounds gagnés quand le joueur joue et quand il ne joue pas.',
    how: 'Rounds gagnés / rounds joués sur les matchs de la période avec lui, puis sans lui.',
    read: "Avec peu de matchs sans un joueur, l'écart n'est pas fiable.",
  },
  eveningRank: {
    title: 'Rang du match dans la session',
    what: "Si l'escouade joue mieux en début ou en fin de session.",
    how: "Session = matchs d'une même journée, un match lancé avant 6h compte pour la veille. Matchs classés par heure de début.",
  },
  startHour: {
    title: 'Heure de début',
    what: "Les résultats selon l'heure à laquelle le match commence.",
    how: "Heure de Paris au lancement du match : avant 21h, de 21h à 23h, après 23h (jusqu'à 6h).",
  },
  weekday: {
    title: 'Jour de la semaine',
    what: 'Les résultats selon le jour où le match est joué.',
    how: 'Jour de lancement du match, heure de Paris.',
  },
  oppLevel: {
    title: 'Niveau des adversaires',
    what: "Les résultats selon que les adversaires ont un rang plus haut ou plus bas que l'escouade.",
    how: "Écart = rang moyen des 5 adversaires - rang moyen des 5 joueurs de l'escouade, en crans de rang (Gold 3 à Platinum 1 = 1 cran). Même niveau : écart de 1,5 cran ou moins. Joueurs sans rang ignorés.",
  },
  ranks: {
    title: 'Rangs des joueurs',
    what: 'Le rang de chaque joueur au début et à la fin de la période, et le rang moyen des adversaires rencontrés.',
    how: 'Rang affiché par le jeu dans le premier et le dernier match de la période. Rang moyen des adversaires : moyenne des rangs des 5 adversaires sur ses matchs, arrondie au rang le plus proche.',
  },
  duration: {
    title: 'Durée des matchs et serveurs',
    what: "La durée typique d'un match et les serveurs sur lesquels l'escouade joue.",
    how: 'Durée médiane du match en minutes. Serveurs : nombre de matchs par serveur.',
  },
};
