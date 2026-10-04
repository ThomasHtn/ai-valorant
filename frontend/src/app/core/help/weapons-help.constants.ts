import { StatHelp } from './stat-help.model';

/** Armes: what each statistic means, how it is counted and how to read it. */
export const WEAPONS_HELP: Readonly<Record<string, StatHelp>> = {
  weaponKillShare: {
    title: 'Part des kills',
    what: "Avec quelle arme l'escouade fait ses kills.",
    how: "Kills sur des adversaires avec cette arme (ou ce type d'arme), divisés par tous les kills sur des adversaires. Les kills sans nom d'arme (ultimes de Chamber et Neon) comptent dans les compétences.",
  },
  weaponDeathShare: {
    title: 'Part des morts subies',
    what: "Quelle arme tue l'escouade.",
    how: "Morts de l'escouade causées par un adversaire avec cette arme, divisées par toutes les morts causées par un adversaire.",
  },
  weaponHs: {
    title: "HS % (rounds avec l'arme)",
    what: 'La part des balles qui touchent la tête quand le joueur a cette arme.',
    how: "Headshots divisés par toutes les balles qui touchent (tête, corps, jambes), sur les rounds où le joueur a cette arme en main à la fin de la phase d'achat. Les balles d'une autre arme du même round sont comptées aussi: Henrik ne donne pas l'arme de chaque tir.",
    read: 'Approximation, plus fiable pour les fusils que pour les pistolets secondaires.',
  },
  weaponDistance: {
    title: 'Distance médiane des kills',
    what: 'À quelle distance les kills sont faits avec cette arme.',
    how: 'Médiane de la distance entre le tueur et la victime au moment du kill, en mètres.',
  },
  weaponRoundsWon: {
    title: "Rounds gagnés avec l'arme",
    what: 'Le taux de victoire quand un joueur joue le round avec cette arme.',
    how: "Rounds gagnés divisés par les rounds joués, comptés par joueur ayant cette arme en main à la fin de la phase d'achat.",
    read: "Dépend surtout du prix de l'arme: à comparer au top ranked, pas entre armes.",
  },
  weaponOperatorRounds: {
    title: 'Rounds avec un Operator',
    what: 'La part des rounds joués avec un Operator.',
    how: "Rounds joueur avec un Operator en main à la fin de la phase d'achat, divisés par tous les rounds joueur (5 par round d'équipe).",
  },
  weaponOperatorKills: {
    title: 'Kills par round Operator',
    what: 'Combien de kills rapporte un Operator acheté.',
    how: "Kills faits à l'Operator divisés par les rounds joueur avec un Operator en main à la fin de la phase d'achat.",
  },
  weaponOperatorWon: {
    title: 'Rounds gagnés avec un Operator',
    what: 'Le taux de victoire des rounds où un joueur a un Operator.',
    how: "Rounds gagnés divisés par les rounds joueur avec un Operator en main à la fin de la phase d'achat.",
  },
  weaponPlayerKills: {
    title: 'Kills',
    what: 'Nombre de kills du joueur avec cette arme sur la période.',
    how: 'Kills sur des adversaires avec cette arme. Les 3 armes avec le plus de kills sont affichées par joueur.',
  },
  weaponPlayerKd: {
    title: "K/D avec l'arme",
    what: 'Combien de kills le joueur fait pour chaque mort quand il joue cette arme.',
    how: "Kills avec l'arme divisés par les morts, les deux comptés sur les rounds où le joueur a acheté cette arme (en main à la fin de la phase d'achat). Une arme ramassée ou le Classic gardé en arme secondaire ne comptent pas. Référence top ranked: joueurs du même rôle.",
    read: "Au-dessus de 1, le joueur gagne plus de duels qu'il n'en perd avec cette arme.",
  },
  weaponSecondary: {
    title: 'Kills en tir secondaire',
    what: "Les kills faits avec le clic droit de l'arme.",
    how: "Kills à l'arme marqués en tir secondaire par le jeu, divisés par tous les kills à l'arme (compétences exclues). Pour les fusils et les snipers, le tir secondaire est la visée au zoom. Référence top ranked: joueurs du même rôle.",
  },
  weaponPickup: {
    title: 'Kills avec une arme ramassée',
    what: "Les kills faits avec une arme prise au sol plutôt qu'achetée.",
    how: "Kills avec une arme principale (hors pistolets et compétences) différente de l'arme en main à la fin de la phase d'achat, divisés par tous les kills. Référence top ranked: joueurs du même rôle.",
  },
};
