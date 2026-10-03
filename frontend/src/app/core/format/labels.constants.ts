import { FindingStatus, LossCause, Reference, Side } from '@core/common/enums.model';

/** French labels of the API's enum values. */
export const SIDE_LABELS: Record<Side, string> = { att: 'Attaque', def: 'Défense' };

/** Long names of the references, as the reference switch and cell tips write them. */
export const REFERENCE_LABELS: Record<Reference, string> = {
  top: 'Top ranked',
  opp: 'Adversaires',
  hist: "Historique de l'escouade",
};

/** Short names, for the segmented control. */
export const REFERENCE_SHORT_LABELS: Record<Reference, string> = {
  top: 'Top ranked',
  opp: 'Adversaires',
  hist: 'Historique',
};

export const STATUS_LABELS: Record<FindingStatus, string> = {
  confirmed: 'Écart net',
  lead: 'À confirmer',
};

export const LOSS_CAUSE_LABELS: Record<LossCause, string> = {
  lead_thrown: 'Avantage perdu',
  clutch_lost: 'Clutch perdu',
  post_plant_lost: 'Post-plant perdu',
  retake_failed: 'Retake raté',
  opening_lost: 'Ouverture perdue',
  economy_gap: 'Écart économique',
  time_out: 'Temps écoulé',
  execute_failed: 'Exécution ratée',
  duels_lost: 'Duels perdus',
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
