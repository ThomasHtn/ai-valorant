import { StatHelp } from './stat-help.model';

/** Joueurs: what each statistic means, how it is counted and how to read it. */
export const PLAYERS_HELP: Readonly<Record<string, StatHelp>> = {
  hs: {
    title: 'HS',
    what: 'La part des balles qui touchent la tête.',
    how: 'Balles à la tête / balles qui touchent (tête, corps, jambes).',
  },
  fbfdPerRound: {
    title: 'FB-FD par round',
    what: 'Le solde entre first bloods faits et first deaths subies, ramené au round.',
    how: '(First bloods - first deaths) / rounds joués. Référence : joueurs du même rôle.',
    read: "Positif : le joueur ouvre plus de rounds qu'il n'en offre à l'adversaire.",
  },
  deathsRevenged: {
    title: 'Morts avec revenge',
    what: 'La part des morts du joueur où un coéquipier tue son tueur juste après.',
    how: "Morts suivies d'une revenge (le tueur meurt sous les coups d'un coéquipier dans les 3 secondes) / morts.",
    read: 'Plus haut = mieux : le joueur meurt à portée de ses coéquipiers.',
  },
  fdPerRound: {
    title: 'First deaths par round',
    what: 'La fréquence à laquelle le joueur est le premier mort du round.',
    how: 'First deaths / rounds joués.',
    read: 'Plus bas = mieux, sauf pour un duelliste qui ouvre les sites.',
  },
  playerProfile: {
    title: 'Profil (radar)',
    what: 'Les chiffres clés du joueur sur une seule toile, chacun comparé à la référence de son rôle.',
    how: "Chaque chiffre du joueur est divisé par celui de la référence. Le cercle pointillé veut donc dire « égal à la référence » sur toutes les branches : c'est un étalon, pas le profil de la référence, d'où sa forme toujours régulière. Chaque cercle vaut 20 % d'écart, de -40 % au centre à +40 % au bord. Pour un chiffre où plus bas = mieux (morts à 0 dégât), le rapport est inversé.",
    read: "Plus loin du centre = mieux. Une branche rentrée montre le point faible à travailler. Un point creux repose sur trop peu de données ou n'a pas de référence.",
  },
  playerOpeningDuels: {
    title: 'Premiers duels',
    what: "Les first bloods et first deaths du joueur et ce que l'équipe en fait.",
    how: 'Taux = first bloods / (first bloods + first deaths). Après first blood : rounds gagnés quand il fait le first blood. Après first death : rounds gagnés quand il est le premier mort.',
  },
  playerUtilityPerRound: {
    title: 'Utilitaires par round',
    what: 'Combien de compétences le joueur lance par round, ultimate exclue.',
    how: 'Utilisations de C, Q et E sur le match divisées par les rounds du match, cumulées sur la période. Référence : joueurs du même rôle.',
    read: "Un initiateur ou un contrôleur sous la référence prépare moins les entrées et les retakes de l'équipe.",
  },
  playerClutchWon: {
    title: 'Clutchs gagnés',
    what: 'La part des clutchs que le joueur gagne quand il se retrouve dernier en vie.',
    how: 'Clutchs gagnés / clutchs joués, toutes tailles confondues (1v1, 1v2...). Référence : joueurs du même rôle.',
    read: 'Une sentinelle reste souvent la dernière en vie : ce chiffre pèse plus pour elle.',
  },
  playerClutches: {
    title: 'Clutchs',
    what: 'Les rounds où le joueur se retrouve dernier en vie face à un ou plusieurs adversaires.',
    how: 'Situation au moment où il devient le dernier en vie de son équipe ; clutch gagné = round gagné.',
  },
  playerWeapons: {
    title: 'Armes',
    what: 'Les 5 armes avec lesquelles le joueur fait le plus de kills, à côté des joueurs du top ranked du même rôle.',
    how: 'Part = kills avec cette arme / tous ses kills. HS = balles à la tête / balles qui touchent, dans les rounds où il a acheté cette arme. Distance médiane des kills en mètres. Ligne « top » : mêmes chiffres pour les joueurs du top ranked du même rôle.',
  },
  playerEconomy: {
    title: 'Économie',
    what: "Les habitudes d'achat du joueur hors pistols, comparées aux joueurs du top ranked du même rôle.",
    how: "Mêmes chiffres que le tableau « Habitudes d'achat par joueur » de Toutes les stats. Achat différent de l'équipe : son loadout seul ne donne pas le même type d'achat que celui de l'équipe.",
  },
  playerDeathZones: {
    title: 'Zones de mort',
    what: 'Les 6 zones où le joueur meurt le plus, par carte.',
    how: 'Zone = callout le plus proche de la position de la victime. Part des first deaths = first deaths dans la zone / morts dans la zone.',
  },
  playerRewatch: {
    title: 'Rounds à revoir',
    what: 'Les derniers rounds de la période où le joueur est mort en premier sans revenge.',
    how: 'First deaths du joueur sans revenge dans les 3 secondes, les 8 plus récentes.',
  },
};
