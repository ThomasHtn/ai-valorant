import { ResultFilter, RoundFilters, RoundSort } from './rounds-filter.model';

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

/** Sort options of the list, in display order; `hint` shows when the pointer rests on one. */
export const ROUND_SORTS: readonly { value: RoundSort; label: string; hint: string }[] = [
  { value: 'date', label: 'Récents', hint: 'Du round le plus récent au plus ancien' },
  {
    value: 'chance',
    label: 'Plus gros throws',
    hint: "Rounds perdus classés selon les meilleures chances de gagner que l'escouade a eues avant de les perdre",
  },
];

/** Results whose list holds only lost rounds: the throw sort means nothing on won rounds. */
export const THROW_SORT_RESULTS: readonly ResultFilter[] = ['lost', 'thrown'];
