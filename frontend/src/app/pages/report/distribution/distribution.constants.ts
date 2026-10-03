import { StatHelp } from '@core/help/stat-help.model';

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
