import { Reference, Side } from '@core/common/enums.model';

/** How the analyst reads the figures; remembered per browser. */
export interface ReportPreferences {
  reference: Reference;
  /** Reference of the Joueurs view: opponents of the same role by default, the leaderboard paints a whole sheet red. */
  playerReference: Reference;
  /** Colour cells against the reference. */
  colours: boolean;
  /** Write the sample under each value. */
  samples: boolean;
  /** Write the reference value under each value. */
  referenceValues: boolean;
}

/** Scope filters shared by the views; empty means everything. */
export interface ReportFilters {
  map: string;
  side: Side | '';
  player: string;
}
