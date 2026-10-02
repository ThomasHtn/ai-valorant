/**
 * Every backend URL, declared once; components never build URLs. The dev server proxies `/api`
 * to the FastAPI backend (see `proxy.conf.json`).
 */
const API = '/api';

export const API_ENDPOINTS = {
  /** `GET` months and patches with squad matches. */
  periods: `${API}/periods`,
  /** `GET` title, maps and profiled players of a period. */
  periodOverview: `${API}/periods/overview`,
  /** `GET` every team section of a period. */
  periodTeam: `${API}/periods/team`,
  /** `GET` the sheet of one map in a period. */
  periodMap: (mapName: string): string => `${API}/periods/maps/${encodeURIComponent(mapName)}`,
  /** `GET` the profile of one squad player in a period. */
  periodPlayer: (puuid: string): string => `${API}/periods/players/${encodeURIComponent(puuid)}`,
  /** `GET` every evening, newest first. */
  sessions: `${API}/sessions`,
  /** `GET` one evening; `latest` for the most recent. */
  session: (day: string): string => `${API}/sessions/${day}`,
  /** `GET` jargon and statistic definitions. */
  glossary: `${API}/glossary`,
  /** `GET` collected matches and last facts rebuild, per source. */
  status: `${API}/status`,
} as const;
