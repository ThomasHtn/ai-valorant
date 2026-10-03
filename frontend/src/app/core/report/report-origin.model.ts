/** Report page a view was opened from, to go back to it. */
export interface ReportOrigin {
  /** Full URL, its period and filters included. */
  url: string;
  /** 'Retour au match', 'Retour à Minimap'. */
  label: string;
}
