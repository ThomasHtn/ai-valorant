import { BuyType } from '@core/common/enums.model';

/** Buys outside pistols, from the cheapest; used for the squad's buy and the opponents'. */
export const ROUND_BUYS: BuyType[] = ['eco', 'force', 'full'];

/** Below this many rounds a line is shown without colour: it would mostly be noise. */
export const BUY_RESULT_MIN_ROUNDS = 5;

/** What the opponents bought, as a line of the squad's buy. */
export const AGAINST_LABELS: Record<BuyType, string> = {
  pistol: 'contre pistol',
  eco: 'contre eco',
  force: 'contre force buy',
  full: 'contre full buy',
};
