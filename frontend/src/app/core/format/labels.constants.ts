import { BuyType, Cohort, FindingStatus, Side } from '@core/common/enums.model';

/** French labels of the API's enum values. */
export const SIDE_LABELS: Record<Side, string> = { att: 'Attaque', def: 'Défense' };

export const BUY_LABELS: Record<BuyType, string> = {
  pistol: 'pistol round',
  eco: 'eco',
  force: 'force buy',
  full: 'full buy',
};

export const COHORT_LABELS: Record<Cohort, string> = {
  squad: 'Escouade',
  opp: 'Adversaires',
  top: 'Top ranked',
};

export const STATUS_LABELS: Record<FindingStatus, string> = {
  confirmed: 'confirmé',
  lead: 'piste',
  mixed: 'confirmé ou piste',
};

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
