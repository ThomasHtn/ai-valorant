import { BuyType } from '@core/common/enums.model';

/** French labels of the round fields the Matches and Rounds views show. */

/** One-letter buy marks of the round strip. */
export const BUY_SHORT_LABELS: Record<BuyType, string> = {
  pistol: 'P',
  eco: 'E',
  force: 'F',
  full: 'FB',
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
