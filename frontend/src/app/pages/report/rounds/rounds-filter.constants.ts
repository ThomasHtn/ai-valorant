import { RoundFilters, RoundSort } from './rounds-filter.model';

/** Lost rounds first: they are the ones worth rewatching. */
export const DEFAULT_ROUND_FILTERS: RoundFilters = {
  match: '',
  result: 'lost',
  cause: '',
  map: '',
  side: '',
  buy: '',
};

export const DEFAULT_ROUND_SORT: RoundSort = 'date';

/** `preset` query parameter of the throws (lost rounds after 70 %), as linked from other views. */
export const THROWS_PRESET = 'throws';

/** Sort options of the list, in display order. */
export const ROUND_SORTS: readonly { value: RoundSort; label: string }[] = [
  { value: 'date', label: 'Récents' },
  { value: 'chance', label: 'Les plus en main' },
];
