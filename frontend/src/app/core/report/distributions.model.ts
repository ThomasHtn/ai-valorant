/**
 * Distribution view (`GET /report/distributions`), mirror of
 * `backend/src/valostats/schemas/report/distributions.py`: histograms of the squad in the period
 * against top ranked.
 */

export interface HistogramBin {
  start: number;
  /** Null for the last, open bin ('90+ s'). */
  end: number | null;
  label: string;
}

export interface Histogram {
  counts: number[];
  /** Counts divided by `n`, so two samples of different sizes compare; null when empty. */
  shares: (number | null)[];
  n: number;
  median: number | null;
}

/** One squad player against top ranked players of his role. */
export interface PlayerHistogram {
  name: string;
  role: string;
  squad: Histogram;
  top: Histogram;
}

export interface Distribution {
  key: string;
  label: string;
  /** Unit of the values ('s', 'm', 'dégâts', 'ACS'). */
  unit: string;
  binSize: number;
  bins: HistogramBin[];
  squad: Histogram;
  top: Histogram;
  /** Per squad player (ACS per match only). */
  players: PlayerHistogram[] | null;
}
