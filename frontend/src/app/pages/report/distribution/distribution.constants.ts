import { StatHelp } from '@core/help/stat-help.model';

import { ReadingTemplate } from './distribution.model';

/** What each histogram counts, shown in its "i" tip and under the chart (keys of the API). */
export const DISTRIBUTION_NOTES: Readonly<Record<string, string>> = {
  firstKillTime: "Temps entre le début du round et le premier kill, tous rounds de l'escouade.",
  plantTime: "Temps du plant depuis le début du round, plants de l'escouade en attaque.",
  killDistance: "Distance entre le tueur et sa victime, kills de l'escouade.",
  damageBeforeDeath: "Dégâts infligés dans le round avant de mourir, morts de l'escouade.",
  acsPerMatch:
    'ACS de chaque joueur sur chaque match. Par joueur, le top ranked est limité au même rôle.',
  roundDuration:
    "Temps du dernier événement du round (kill, plant ou defuse). Les rounds finis à l'explosion ou au temps sont estimés.",
};

/** Explanation of a histogram for its "i" tip. */
export function distributionHelp(key: string, label: string): StatHelp | null {
  const what = DISTRIBUTION_NOTES[key];
  return what ? { title: label, what } : null;
}

/** Value of the "Qui" select meaning the whole squad. */
export const SQUAD_SUBJECT = 'squad';

/** What the gap of medians means in game terms, one template per histogram (keys of the API). */
export const DISTRIBUTION_READINGS: Readonly<Record<string, ReadingTemplate>> = {
  firstKillTime: {
    more: (gap, w) => `${w.who} prend le premier contact ${gap} plus tard que ${w.top}.`,
    less: (gap, w) => `${w.who} prend le premier contact ${gap} plus tôt que ${w.top}.`,
    same: (w) => `${w.who} prend le premier contact au même moment que ${w.top}.`,
  },
  plantTime: {
    more: (gap, w) => `${w.who} plante ${gap} plus tard que ${w.top}.`,
    less: (gap, w) => `${w.who} plante ${gap} plus tôt que ${w.top}.`,
    same: (w) => `${w.who} plante au même moment que ${w.top}.`,
  },
  killDistance: {
    more: (gap, w) => `Les kills ${w.of} se font ${gap} plus loin que ceux du ${topNoun(w.top)}.`,
    less: (gap, w) => `Les kills ${w.of} se font ${gap} plus près que ceux du ${topNoun(w.top)}.`,
    same: (w) => `Les kills ${w.of} se font à la même distance que ceux du ${topNoun(w.top)}.`,
  },
  damageBeforeDeath: {
    more: (gap, w) => `${w.who} inflige ${gap} de plus avant de mourir que ${w.top}.`,
    less: (gap, w) => `${w.who} inflige ${gap} de moins avant de mourir que ${w.top}.`,
    same: (w) => `${w.who} inflige autant de dégâts avant de mourir que ${w.top}.`,
  },
  acsPerMatch: {
    more: (gap, w) => `L'ACS médian ${w.of} dépasse de ${gap} celui du ${topNoun(w.top)}.`,
    less: (gap, w) => `L'ACS médian ${w.of} est ${gap} sous celui du ${topNoun(w.top)}.`,
    same: (w) => `L'ACS médian ${w.of} est celui du ${topNoun(w.top)}.`,
  },
  roundDuration: {
    more: (gap, w) => `Les rounds ${w.of} durent ${gap} de plus que ceux du ${topNoun(w.top)}.`,
    less: (gap, w) => `Les rounds ${w.of} durent ${gap} de moins que ceux du ${topNoun(w.top)}.`,
    same: (w) => `Les rounds ${w.of} durent autant que ceux du ${topNoun(w.top)}.`,
  },
};

/** 'top ranked' from 'le top ranked', to write 'ceux du top ranked'. */
function topNoun(top: string): string {
  return top.replace(/^le /, '');
}

/** Shown instead of the plant histogram in defense, where the squad never plants. */
export const NO_PLANT_IN_DEFENSE = "Pas de plant en défense : l'escouade plante en attaque.";
