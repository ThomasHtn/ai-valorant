import { Noun, Rate } from '@core/common/common.model';
import { Rating } from '@core/rating/rating.model';

/** One situation to compare: the squad's successes over its tries beside a reference rate. */
export interface GapLine {
  /** 'Sunset B', '4v5', 'Force buy contre full buy'. */
  label: string;
  /** A muted second line ('50 % des plants adverses'). */
  detail?: string;
  squad: Rate;
  reference: Rate | null;
  /** Says what the reference is when it is not the column's ('adversaire' for an even 50 %). */
  referenceNote?: string;
  /** What one success is; rounds unless said otherwise. */
  unit?: Noun;
}

/** A line as the list draws it, read and ready to sort. */
export interface GapRow extends GapLine {
  /** Successes above or below what the reference rate gives on the same tries. */
  gap: number;
  rating: Rating;
  /** Too few tries, or no reference: shown without colour, at the end of the list. */
  muted: boolean;
}
