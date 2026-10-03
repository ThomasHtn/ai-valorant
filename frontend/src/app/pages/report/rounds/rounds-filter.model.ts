import { BuyType, LossCause, Side } from '@core/common/enums.model';

/** Which rounds the list shows by result. */
export type ResultFilter = 'lost' | 'won' | 'all';

/** Filters of the rounds list; an empty string means "any". */
export interface RoundFilters {
  result: ResultFilter;
  cause: LossCause | '';
  map: string;
  side: Side | '';
  buy: BuyType | '';
}

/** Map and side a list is narrowed to when the view's own filters leave them open. */
export interface RoundScope {
  map: string;
  side: Side | '';
}
