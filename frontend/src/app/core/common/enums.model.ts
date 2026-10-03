/** Closed value sets shared with the API (see `backend/src/valostats/domain/enums.py`). */

export type Side = 'att' | 'def';

export type BuyType = 'pistol' | 'eco' | 'force' | 'full';

/** Squad, its opponents in the same matches, or a top ranked team. */
export type Cohort = 'squad' | 'opp' | 'top';

/** Confirmed gaps survive the multiple-testing correction; leads are only worth watching. */
export type FindingStatus = 'confirmed' | 'lead';

/** What a squad figure is compared with: top ranked games, the opponents of the same matches, the squad's history. */
export type Reference = 'top' | 'opp' | 'hist';

/** Reference of a table column: `none` for plain counts, never coloured. */
export type ColumnReference = Reference | 'none';

/** Why a round was lost, computed from its timeline. */
export type LossCause =
  | 'lead_thrown'
  | 'clutch_lost'
  | 'post_plant_lost'
  | 'retake_failed'
  | 'opening_lost'
  | 'economy_gap'
  | 'time_out'
  | 'execute_failed'
  | 'duels_lost';
