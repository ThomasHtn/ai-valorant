import { StatHelp } from './stat-help.model';

/** Économie: what each statistic means, how it is counted and how to read it. */
export const ECONOMY_HELP: Readonly<Record<string, StatHelp>> = {
  ecoBuySplit: {
    title: 'Répartition des achats',
    what: "Comment l'escouade achète sur les rounds hors pistols.",
    how: "Type d'achat selon la valeur moyenne du loadout des 5 joueurs: eco sous 1500 crédits, full buy à partir de 3700 crédits, force buy entre les deux. Part des rounds hors pistols.",
    read: 'Beaucoup de force buys veut souvent dire une économie subie.',
  },
  ecoBuyMatrix: {
    title: 'Rounds gagnés selon les deux achats',
    what: 'Le taux de victoire selon votre achat et celui des adversaires.',
    how: "Rounds gagnés divisés par les rounds joués pour chaque couple achat de l'équipe et achat adverse (eco, force buy, full buy, mêmes seuils que la répartition). Pistols exclus.",
    read: "Un eco gagné contre un full buy est un gros bonus; un full buy perdu contre un eco est un throw. Les cases à achat égal sont comparées à l'historique : le top ranked y est toujours à 50 %.",
  },
  ecoBuyMismatch: {
    title: "Achat différent de l'équipe",
    what: "Les rounds où le joueur n'achète pas comme le reste de l'équipe : il force pendant que l'équipe eco, ou l'inverse.",
    how: "Type d'achat du joueur selon son seul loadout (eco sous 1500 crédits, full buy à partir de 3700 crédits), comparé au type d'achat de l'équipe. Part des rounds hors pistols. Référence top ranked : joueurs du même rôle.",
    read: "Plus c'est bas, plus l'équipe achète ensemble.",
  },
  ecoWeaponClass: {
    title: 'Arme principale la plus jouée',
    what: "La classe d'arme la plus achetée sur ce type de round (SMG, fusils, pistolets…).",
    how: "Classe de l'arme principale de chaque joueur en fin de phase d'achat, la plus fréquente sur les rounds de la ligne, avec sa part.",
    read: 'Un R2 classé « force buy » est souvent un achat de SMG avec armure : cette colonne le dit.',
  },
  ecoLoadout: {
    title: 'Valeur moyenne du loadout',
    what: "Combien vaut en moyenne l'équipement du joueur au début du round.",
    how: 'Moyenne de la valeur du loadout (armes et armure) du joueur sur les rounds hors pistols, en crédits. Référence top ranked: joueurs du même rôle.',
  },
  ecoRemaining: {
    title: 'Crédits restants en full buy',
    what: "L'argent que le joueur garde en poche quand l'équipe fait un full buy.",
    how: "Moyenne des crédits restants après la phase d'achat, sur les rounds où l'équipe est en full buy (loadout moyen à partir de 3700 crédits).",
    read: 'Un gros reste peut servir à acheter pour un coéquipier.',
  },
  ecoHeavyArmor: {
    title: 'Armure lourde en full buy',
    what: "Le joueur prend-il l'armure lourde quand l'équipe achète tout.",
    how: "Rounds où l'équipe est en full buy et le joueur a l'armure lourde, divisés par les rounds en full buy.",
  },
  ecoLostValue: {
    title: 'Valeur perdue par round perdu',
    what: "L'équipement que le joueur perd en mourant quand le round est perdu.",
    how: "Pour chaque round perdu hors pistols, valeur du loadout du joueur s'il est mort, 0 s'il a survécu; moyenne en crédits.",
    read: "Plus c'est bas, moins chaque round perdu coûte cher.",
  },
  ecoRoundTypes: {
    title: 'Achat selon le type de round',
    what: "Ce que l'escouade achète et gagne selon la situation économique.",
    how: 'Achat le plus fréquent avec sa part, et rounds gagnés. Les lignes après 1 ou 2 rounds perdus excluent les pistols, les rounds 2 et 3 de chaque mi-temps et les prolongations. R3 bonus: pistol et R2 gagnés.',
    read: "La ligne Pistol est comparée à l'historique : le top ranked y est toujours à 50 %.",
  },
  ecoTeamLoadout: {
    title: 'Valeur moyenne du loadout',
    what: "Combien vaut l'équipement moyen d'un joueur de l'équipe sur ces rounds.",
    how: 'Moyenne de la valeur du loadout des 5 joueurs, en crédits, sur les rounds de la ligne.',
  },
  ecoPistolLoadout: {
    title: 'Achat au pistol',
    what: 'Ce que les joueurs achètent aux rounds pistol.',
    how: "Part des joueurs, sur les rounds pistol (round 1 et round 13), qui ont cette armure ou cette arme en main à la fin de la phase d'achat.",
  },
  ecoPistolWon: {
    title: 'Pistols gagnés',
    what: 'Le taux de victoire des pistols quand le joueur a pris cet achat.',
    how: 'Rounds pistol gagnés divisés par les rounds pistol joués, comptés par joueur avec cet achat.',
  },
};
