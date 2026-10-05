import { StatHelp } from './stat-help.model';

/** Escouade: gaps in rounds, map verdicts and the headline band. */
export const SQUAD_HELP: Readonly<Record<string, StatHelp>> = {
  gapRounds: {
    title: 'Écart au top ranked',
    what: "Rounds gagnés de plus (+) ou de moins (−) qu'une équipe top ranked qui aurait joué les mêmes rounds dans la même situation.",
    how: '(taux de l’escouade − taux du top ranked) × nombre de rounds',
    read: 'Les écarts se recoupent (un round peut être à la fois un full buy et un retake) : ne pas les additionner.',
  },
  perMatch: {
    title: 'Par match',
    what: "L'écart en rounds divisé par le nombre de matchs de la période : ce que la situation pèse dans un match.",
  },
  mapStrip: {
    title: 'Par carte',
    what: "Le même écart, carte par carte. Rouge sur toutes les cartes : une habitude de l'escouade. Une seule case rouge : un problème propre à la carte.",
  },
  mapVerdict: {
    title: 'Verdict de carte',
    what: "Où mettre l'entraînement. L'escouade joue en ranked : pas de pick ni de ban.",
    how: 'Solide : 2 rounds ou plus au-dessus du top ranked. À travailler : 5 rounds ou plus en dessous. À stabiliser : entre les deux. À tester : moins de 3 matchs.',
  },
  turningRounds: {
    title: 'Rounds basculés',
    what: "Rounds perdus alors que l'escouade avait au moins 70 % de chances de les gagner à un moment.",
    how: 'Chances mesurées sur les rounds top ranked dans la même situation (joueurs en vie, spike posé ou non).',
  },
  firstDuels: {
    title: 'Premier duel',
    what: "Le premier kill du round. L'équipe qui le gagne joue à 5 contre 4.",
    how: 'premiers duels gagnés ÷ premiers duels',
  },
  playerCost: {
    title: 'Coût en rounds',
    what: "L'écart du joueur traduit en rounds : chaque duel, mort ou clutch vaut ce qu'il change au round chez le top ranked de son rôle.",
    how: 'écart × (rounds gagnés quand ça se passe bien − quand ça se passe mal, chez le top ranked)',
  },
  offPool: {
    title: 'Hors pool',
    what: "Carte sortie du map pool compétitif en cours : ses matchs restent dans Sessions mais n'entrent dans aucun chiffre.",
  },
  collecting: {
    title: 'Collecte en cours',
    what: 'La carte vient d’entrer dans le pool ou le patch vient de sortir : trop peu de matchs top ranked pour la comparer.',
    how: 'Comparée dès 100 matchs top ranked ; la collecte vise 400 matchs par carte et par patch.',
  },
};
