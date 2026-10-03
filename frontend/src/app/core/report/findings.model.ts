import { FindingStatus, LossCause, Reference } from '@core/common/enums.model';

import { Rate } from './rate.model';
import { GameArt } from './stat-table.model';

/** Points forts et faibles, mirror of `backend/src/valostats/schemas/report/findings.py`. */

export type FindingSide = 'weak' | 'strong';

export type FindingGroup = 'team' | 'players';

/** A round to rewatch ('30/09 Split R14'); a whole match when `roundNumber` is null. */
export interface RewatchRound {
  matchId: string;
  day: string;
  mapName: string;
  roundNumber: number | null;
}

/** A squad rate tested against a reference, with the rounds won or lost compared with it. */
export interface Finding {
  side: FindingSide;
  group: FindingGroup;
  /** Where the gap is: 'Split · défense', 'DuffManBzH'. Shown as is. */
  scope: string;
  /** What is measured: 'Morts sans dégâts'. Shown as is. */
  metric: string;
  kind: string;
  art: GameArt | null;
  /** Reference the test was run against; both are shown. */
  reference: Exclude<Reference, 'hist'>;
  squad: Rate;
  opp: Rate;
  top: Rate;
  leverage: number;
  /** Rounds won (+) or lost (-) compared with the reference on the same sample. */
  gapRounds: number;
  pValue: number;
  status: FindingStatus;
  rewatch: RewatchRound[];
}

/** Bonus round (third round after a won pistol and second round), checked whatever its p-value. */
export interface BonusRoundCheck {
  metric: string;
  squad: Rate;
  opp: Rate;
  top: Rate;
  hist: Rate;
  pValue: number;
  gapRounds: number | null;
  lostCauses: Partial<Record<LossCause, number>>;
  rewatch: RewatchRound[];
}

export interface FindingsReport {
  /** Comparisons tested in the period, all corrected together. */
  tests: number;
  /** False discovery rate of the correction. */
  q: number;
  findings: Finding[];
  bonusRound: BonusRoundCheck;
}
