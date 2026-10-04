import { StatHelp } from './stat-help.model';

/** Positions: what each statistic means, how it is counted and how to read it. */
export const POSITIONS_HELP: Readonly<Record<string, StatHelp>> = {
  zoneKd: {
    title: 'Kills et morts par zone',
    what: "Combien de kills l'escouade fait et combien de morts elle prend dans chaque zone de la carte, par côté.",
    how: 'Zone = callout le plus proche de la position du tueur (kills) ou de la victime (morts). K/M = kills depuis la zone / morts dans la zone. Seules les zones avec au moins 5 kills ou morts sont listées.',
    read: "Un K/M sous 1 veut dire que l'escouade perd plus de duels qu'elle n'en gagne dans cette zone.",
  },
  zoneFirstDeaths: {
    title: 'Part des first deaths',
    what: "Parmi les morts de l'escouade dans la zone, la part qui sont la première mort du round.",
    how: 'First deaths dans la zone / morts dans la zone, même carte et même côté.',
    read: "Une part élevée signale une zone où l'escouade s'expose en début de round.",
  },
  engageDistance: {
    title: "Distance d'engagement",
    what: 'À quelle distance le joueur fait ses kills et prend ses morts.',
    how: 'Distance entre le tueur et la victime au moment du kill. Courte : moins de 10 m, moyenne : 10 à 25 m, longue : plus de 25 m. Référence : joueurs du même rôle.',
    read: 'Pas de bonne valeur : sert à voir si un joueur prend des duels à une distance qui ne convient pas à son rôle ou à son arme.',
  },
  killDistance: {
    title: 'Distance médiane des kills',
    what: 'La distance typique à laquelle le joueur tue.',
    how: 'Médiane des distances tueur-victime de ses kills, en mètres.',
  },
  contactZones: {
    title: 'Zones de contact adverses',
    what: "Les 3 zones d'où les adversaires tuent le plus souvent l'escouade, par carte et par côté.",
    how: "Zone = callout le plus proche de la position du tueur adverse. Pourcentage = morts de l'escouade tuée depuis cette zone / toutes ses morts sur la carte et le côté. Top 3 en top ranked : mêmes zones calculées sur les matchs top ranked.",
  },
};
