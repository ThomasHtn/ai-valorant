import { BuyType, LossCause, Side } from '@core/common/enums.model';
import { dayMonth } from '@core/format/format.utils';
import { LOSS_CAUSE_LABELS } from '@core/format/labels.constants';
import { RoundQuery } from '@core/report/round-query.model';
import { RoundLine } from '@core/report/rounds.model';

import {
  DEFAULT_ROUND_FILTERS,
  DEFAULT_ROUND_SORT,
  THROWS_PRESET,
  THROW_SORT_RESULTS,
} from './rounds-filter.constants';
import {
  CauseCount,
  ResultFilter,
  RoundFilters,
  RoundParams,
  RoundScope,
  RoundSort,
} from './rounds-filter.model';
import { MomentKind } from './rounds-overview.model';
import { momentKeys, roundKey } from './rounds-overview.utils';

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
  const moment = filters.moment ? momentKeys(rounds, filters.moment) : null;
  return rounds.filter(
    (round) =>
      (!filters.match || round.matchId === filters.match) &&
      keepsResult(round, filters.result) &&
      (!filters.cause || round.cause === filters.cause) &&
      (!map || round.mapName === map) &&
      (!side || round.side === side) &&
      (!filters.buy || round.buy === filters.buy) &&
      (!moment || moment.has(roundKey(round))),
  );
}

/** 'Match Split 6-13 du 30/09': the match the list is limited to, its score counted from its rounds. */
export function matchLabel(rounds: readonly RoundLine[], matchId: string): string {
  const own = rounds.filter((round) => round.matchId === matchId);
  if (!own.length) {
    return 'Match';
  }
  const won = own.filter((round) => round.won).length;
  return `Match ${own[0].mapName} ${won}-${own.length - won} du ${dayMonth(own[0].day)}`;
}

/** Maps present in the period, for the map filter. */
export function filterMaps(rounds: readonly RoundLine[]): string[] {
  return [...new Set(rounds.map((round) => round.mapName))].sort();
}

/** Lost rounds of the list grouped by cause, most frequent first. */
export function causeCounts(rounds: readonly RoundLine[]): CauseCount[] {
  const counts = new Map<LossCause, number>();
  let lost = 0;
  for (const round of rounds) {
    if (!round.won) {
      lost += 1;
      if (round.cause) {
        counts.set(round.cause, (counts.get(round.cause) ?? 0) + 1);
      }
    }
  }
  return [...counts]
    .sort((a, b) => b[1] - a[1])
    .map(([cause, count]) => ({
      cause,
      label: LOSS_CAUSE_LABELS[cause],
      count,
      share: count / lost,
    }));
}

/** Moments a URL may name. */
const MOMENTS: readonly MomentKind[] = ['streak', 'after_pistol_loss', 'bonus'];

function keepsResult(round: RoundLine, result: ResultFilter): boolean {
  switch (result) {
    case 'all':
      return true;
    case 'won':
      return round.won;
    case 'lost':
      return !round.won;
    case 'thrown':
      return round.thrown;
  }
}

/** The list in the chosen order: as given (newest first) or the best chance of winning first. */
/** The sort really applied: the throw sort only on lists of lost rounds, the date order otherwise. */
export function effectiveSort(result: ResultFilter, sort: RoundSort): RoundSort {
  return THROW_SORT_RESULTS.includes(result) ? sort : DEFAULT_ROUND_SORT;
}

export function sortRounds(rounds: readonly RoundLine[], sort: RoundSort): RoundLine[] {
  return sort === 'chance'
    ? [...rounds].sort((a, b) => (b.bestProbability ?? 0) - (a.bestProbability ?? 0))
    : [...rounds];
}

/**
 * Filters and sort read from the URL ('?map=Split&side=def&result=lost&preset=throws'), falling back
 * on the given filters for what the URL leaves out. Unknown values are ignored.
 */
export function readRoundParams(
  params: Partial<RoundParams>,
  fallback: RoundFilters,
): { filters: RoundFilters; sort: RoundSort } {
  const side = params.side === 'att' || params.side === 'def' ? params.side : fallback.side;
  const results: readonly ResultFilter[] = ['lost', 'won', 'all'];
  const result: ResultFilter =
    params.preset === THROWS_PRESET
      ? 'thrown'
      : results.includes(params.result as ResultFilter)
        ? (params.result as ResultFilter)
        : fallback.result;
  return {
    filters: {
      match: params.match ?? fallback.match,
      result,
      cause: (params.cause as LossCause | null) ?? fallback.cause,
      map: params.map ?? fallback.map,
      side,
      buy: (params.buy as BuyType | null) ?? fallback.buy,
      moment: (MOMENTS as readonly string[]).includes(params.moment ?? '')
        ? (params.moment as MomentKind)
        : fallback.moment,
    },
    sort: params.sort === 'chance' ? 'chance' : DEFAULT_ROUND_SORT,
  };
}

/** Query parameters of the filters and sort; defaults become null so the URL stays short. */
export function roundParams(filters: RoundFilters, sort: RoundSort): RoundParams {
  const thrown = filters.result === 'thrown';
  return {
    match: filters.match || null,
    map: filters.map || null,
    side: filters.side || null,
    result: thrown || filters.result === DEFAULT_ROUND_FILTERS.result ? null : filters.result,
    preset: thrown ? THROWS_PRESET : null,
    cause: filters.cause || null,
    buy: filters.buy || null,
    moment: filters.moment || null,
    sort: sort === DEFAULT_ROUND_SORT ? null : sort,
  };
}
