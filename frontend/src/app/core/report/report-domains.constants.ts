/** Domains of the metrics dictionary, in the order of the Tableaux view's list; keys match the API. */
export const REPORT_DOMAINS: readonly { key: string; label: string }[] = [
  { key: 'results', label: 'Résultats' },
  { key: 'opening', label: 'Ouvertures' },
  { key: 'combat', label: 'Combat' },
  { key: 'revenge', label: 'Revenge et espacement' },
  { key: 'situations', label: 'Situations' },
  { key: 'spike', label: 'Spike' },
  { key: 'economy', label: 'Économie' },
  { key: 'weapons', label: 'Armes' },
  { key: 'utility', label: 'Utilitaire' },
  { key: 'timings', label: 'Timings' },
  { key: 'positions', label: 'Positions' },
  { key: 'agents', label: 'Agents et compos' },
  { key: 'context', label: 'Contexte' },
  { key: 'behavior', label: 'Comportement' },
];

/** Domain shown when the URL names none. */
export const DEFAULT_DOMAIN = 'results';

/** Route key of the Alertes entry, listed before the domains (`/report/tables/detections`). */
export const DETECTIONS_KEY = 'detections';

/** Label of the Alertes entry. */
export const DETECTIONS_LABEL = 'Alertes';
