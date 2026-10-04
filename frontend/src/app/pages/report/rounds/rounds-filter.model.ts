import { BuyType, LossCause, Side } from '@core/common/enums.model';

import { MomentKind } from './rounds-overview.model';

/** Which rounds the list shows by result; 'thrown' keeps the lost rounds the squad had in hand. */
export type ResultFilter = 'lost' | 'thrown' | 'won' | 'all';

/** Order of the list: newest first, or the rounds the squad had most in hand first. */
export type RoundSort = 'date' | 'chance';

/** Filters of the rounds list; an empty string means "any". */
export interface RoundFilters {
  /** Match the list came from (a click in Matchs), empty for the whole period. */
  match: string;
  result: ResultFilter;
  cause: LossCause | '';
  map: string;
  side: Side | '';
  buy: BuyType | '';
  /** A moment of the match (losing streak, round after a lost pistol...), picked in its block. */
  moment: MomentKind | '';
}

/** Map and side a list is narrowed to when the view's own filters leave them open. */
export interface RoundScope {
  map: string;
  side: Side | '';
}

/** Query parameters of the list's filters and sort, null when left at their default. */
export type RoundParams = Record<
  'match' | 'map' | 'side' | 'result' | 'preset' | 'cause' | 'buy' | 'moment' | 'sort',
  string | null
>;

/** One ring of the "lost rounds by cause" grid; `share` is its part of the lost rounds (0..1). */
export interface CauseCount {
  cause: LossCause;
  label: string;
  count: number;
  share: number;
}
