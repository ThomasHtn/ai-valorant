import { BuyType, LossCause } from '@core/common/enums.model';

/** French labels of the round fields the Matches and Rounds views show. */

/** Short buy names of the round strip, readable without a legend. */
export const BUY_SHORT_LABELS: Record<BuyType, string> = {
  pistol: 'Pistol',
  eco: 'Eco',
  force: 'Force',
  full: 'Full',
};

/** Buys inside a sentence ('force buy contre full buy'). */
export const BUY_SENTENCE_LABELS: Record<BuyType, string> = {
  pistol: 'pistol',
  eco: 'eco',
  force: 'force buy',
  full: 'full buy',
};

/** How a round ended (Henrik's `result`); an empty result means the time ran out. */
export const RESULT_LABELS: Record<string, string> = {
  Elimination: 'Élimination',
  Detonate: 'Explosion',
  Defuse: 'Defuse',
  Surrendered: 'Abandon',
  '': 'Temps écoulé',
};

/** Round ceremonies worth naming; the default one is not shown. */
export const CEREMONY_LABELS: Record<string, string> = {
  CeremonyFlawless: 'Round parfait',
  CeremonyClutch: 'Clutch',
  CeremonyAce: 'Ace',
  CeremonyTeamAce: "Ace d'équipe",
  CeremonyThrifty: 'Victoire en eco',
  CeremonyCloser: 'Round de la victoire',
};

export const ARMOR_LABELS: Record<string, string> = {
  'Heavy Armor': 'Lourde',
  'Light Armor': 'Légère',
  'Regen Shield': 'Régénérante',
};

/** Why a cause was given, as written after its label ('Clutch perdu : le round est allé jusqu'au 1v1'). */
export const LOSS_CAUSE_REASONS: Record<LossCause, string> = {
  lead_thrown: "l'escouade a mené de 2 joueurs ou plus",
  clutch_lost: "le round est allé jusqu'au 1v1",
  post_plant_lost: 'spike posé à égalité ou en supériorité, puis defuse adverse',
  retake_failed: "plant adverse alors que l'escouade était à égalité ou en supériorité",
  opening_lost: "first death sans revenge, et l'escouade n'est jamais revenue à égalité",
  economy_gap: 'eco ou force buy contre un full buy',
  time_out: 'temps écoulé sans plant, avec des attaquants encore en vie',
  execute_failed: 'attaque perdue sans plant',
  duels_lost: 'aucune autre situation, les duels ont été perdus',
};
