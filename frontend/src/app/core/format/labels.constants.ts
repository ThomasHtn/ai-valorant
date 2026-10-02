import { BuyType, Cohort, FindingStatus, Side } from '@core/common/enums.model';

/** French labels of the API's enum values. */
export const SIDE_LABELS: Record<Side, string> = { att: 'Attaque', def: 'Défense' };

export const BUY_LABELS: Record<BuyType, string> = {
  pistol: 'Pistol',
  eco: 'Eco',
  force: 'Force buy',
  full: 'Full buy',
};

export const COHORT_LABELS: Record<Cohort, string> = {
  squad: "L'escouade",
  opp: 'Adversaire',
  top: 'Top ranked',
};

export const STATUS_LABELS: Record<FindingStatus, string> = {
  confirmed: 'Écart net',
  lead: 'À confirmer',
};

/** API scope of a finding over every map. */
export const ALL_MAPS_SCOPE = 'Toutes cartes';

export const MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];
