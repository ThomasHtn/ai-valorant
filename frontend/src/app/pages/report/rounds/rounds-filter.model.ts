import { BuyType, LossCause, Side } from '@core/common/enums.model';

/** Which rounds the list shows by result; 'thrown' keeps the lost rounds the squad had in hand. */
export type ResultFilter = 'lost' | 'thrown' | 'won' | 'all';

/** Order of the list: newest first, or the biggest fall of the squad's chance first. */
export type RoundSort = 'date' | 'swing';

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

/** Query parameters of the list's filters and sort, null when left at their default. */
export type RoundParams = Record<
  'map' | 'side' | 'result' | 'preset' | 'cause' | 'buy' | 'sort',
  string | null
>;
