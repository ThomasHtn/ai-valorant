import { LossCause, Side } from '@core/common/enums.model';
import { RoundQuery } from '@core/report/round-query.model';
import { RoundLine } from '@core/report/rounds.model';

import { RoundFilters, RoundScope } from './rounds-filter.model';

/**
 * Map and side named in a table cell's text (a click in Tableaux): a map is kept only when exactly
 * one of the period's maps is named, a side when "attaque" or "défense" appears.
 */
export function queryScope(query: RoundQuery | null, maps: readonly string[]): RoundScope {
  if (!query) {
    return { map: '', side: '' };
  }
  const named = maps.filter((map) => query.text.includes(map.toLowerCase()));
  const side: Side | '' = query.text.includes('attaque')
    ? 'att'
    : query.text.includes('défense')
      ? 'def'
      : '';
  return { map: named.length === 1 ? named[0] : '', side };
}

/**
 * Rounds kept by the list. The view's own map and side win; otherwise the scope (a clicked cell)
 * applies.
 */
export function filterRounds(
  rounds: readonly RoundLine[],
  filters: RoundFilters,
  scopes: readonly RoundScope[],
): RoundLine[] {
  const map = filters.map || scopes.find((s) => s.map)?.map || '';
  const side = filters.side || scopes.find((s) => s.side)?.side || '';
  return rounds.filter(
    (round) =>
      (filters.result === 'all' || round.won === (filters.result === 'won')) &&
      (!filters.cause || round.cause === filters.cause) &&
      (!map || round.mapName === map) &&
      (!side || round.side === side) &&
      (!filters.buy || round.buy === filters.buy),
  );
}

/** Causes and maps present in the period, for the filter options. */
export function filterOptions(rounds: readonly RoundLine[]): {
  causes: LossCause[];
  maps: string[];
} {
  const causes = new Set<LossCause>();
  const maps = new Set<string>();
  for (const round of rounds) {
    if (round.cause) {
      causes.add(round.cause);
    }
    maps.add(round.mapName);
  }
  return { causes: [...causes].sort(), maps: [...maps].sort() };
}
