import { RoundRef } from '@core/common/common.model';
import { FindingMatch, MatchWording } from '@core/periods/findings.model';
import { PointCardContent } from '@shared/point-card/point-card.model';

/**
 * A point as a row: what it says, its matches from the one that weighs most, how each match's
 * figure reads, and the rounds to rewatch. Prepared once in a `computed`.
 */
export interface PointRowContent {
  card: PointCardContent;
  matches: FindingMatch[];
  wording: MatchWording;
  rewatch: RoundRef[];
}
