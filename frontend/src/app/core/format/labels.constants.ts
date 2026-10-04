import { FindingStatus, LossCause, Reference, Side } from '@core/common/enums.model';

/** French labels of the API's enum values. */
export const SIDE_LABELS: Record<Side, string> = { att: 'Attaque', def: 'Défense' };

/** Long names of the references, as the reference switch and cell tips write them. */
export const REFERENCE_LABELS: Record<Reference, string> = {
  top: 'Top ranked',
  opp: 'Adversaires',
  hist: "L'escouade avant la période",
};

/** Short names, for table columns. */
export const REFERENCE_SHORT_LABELS: Record<Reference, string> = {
  top: 'Top ranked',
  opp: 'Adversaires',
  hist: 'Avant la période',
};

/** Options of the "Comparer à" switch: they must say who the squad is measured against. */
export const REFERENCE_OPTION_LABELS: Record<Reference, string> = {
  top: 'Top ranked',
  opp: 'Adversaires affrontés',
  hist: 'Avant la période',
};

/** End of "Comparé …" under the switch, for team figures. */
export const REFERENCE_SENTENCES: Record<Reference, string> = {
  top: 'aux équipes du top ranked (top 20 de chaque région)',
  opp: 'aux équipes affrontées dans ces mêmes matchs',
  hist: "à l'escouade avant cette période",
};

/** Same, for a player measured against players of his role. */
export const REFERENCE_ROLE_SENTENCES: Record<Reference, string> = {
  top: 'aux joueurs top ranked du même rôle',
  opp: 'aux joueurs du même rôle dans les équipes affrontées',
  hist: 'à ses propres matchs avant cette période',
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
