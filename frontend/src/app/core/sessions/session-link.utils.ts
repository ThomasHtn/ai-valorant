import { MatchLink } from '@core/common/common.model';

/** Query parameter of the session page naming the match to open (`/sessions/2026-10-01?match=…`). */
export const MATCH_QUERY_PARAM = 'match';

/** Route of the evening a match belongs to. */
export function sessionRoute(link: MatchLink): string[] {
  return ['/sessions', link.sessionDay];
}

/** Query parameters that open the match itself rather than the evening summary. */
export function matchQueryParams(link: MatchLink): Record<string, string> {
  return { [MATCH_QUERY_PARAM]: link.matchId };
}
