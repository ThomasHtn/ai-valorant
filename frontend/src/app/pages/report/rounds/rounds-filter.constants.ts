import { RoundFilters } from './rounds-filter.model';

/** Lost rounds first: they are the ones worth rewatching. */
export const DEFAULT_ROUND_FILTERS: RoundFilters = {
  result: 'lost',
  cause: '',
  map: '',
  side: '',
  buy: '',
};
