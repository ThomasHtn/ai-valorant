import { Rate } from '@core/common/common.model';
import { Rating } from '@core/rating/rating.model';

/** One situation of a buy: the squad's rounds won beside the top ranked in the same spot. */
export interface BuyResultLine {
  label: string;
  squad: Rate;
  top: Rate;
  /** Colour of the figure, read against the top ranked. */
  rating: Rating;
  /** Gap to the top ranked ('-9 pts'). */
  gap: string;
  /** Too few rounds to read: shown without colour. */
  muted: boolean;
}

/** The lines of one buy (pistol, eco, force buy, full buy). */
export interface BuyResultGroup {
  label: string;
  lines: BuyResultLine[];
}
