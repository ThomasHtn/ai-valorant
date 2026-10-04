import { Side } from '@core/common/enums.model';

/** Rounds won and lost on one side of the match, or in overtime (no side). */
export interface HalfScore {
  key: string;
  label: string;
  side: Side | null;
  won: number;
  lost: number;
}
