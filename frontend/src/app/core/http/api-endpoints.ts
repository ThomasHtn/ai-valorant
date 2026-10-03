/**
 * Every backend URL, declared once; components never build URLs. The dev server proxies `/api`
 * to the FastAPI backend (see `proxy.conf.json`).
 */
const API = '/api';
const REPORT = `${API}/report`;

export const API_ENDPOINTS = {
  /** `GET` the report tree: months with their evenings, patches, data freshness. */
  reportPeriods: `${REPORT}/periods`,
  /** `GET` what a period covers: header facts, maps and players, data quality. */
  reportMeta: `${REPORT}/meta`,
  /** `GET` every table of one domain of the metrics dictionary. */
  reportTables: (domain: string): string => `${REPORT}/tables/${encodeURIComponent(domain)}`,
  // Matches, rounds and minimap views.
  /** `GET` matches of the period grouped by evening. */
  reportMatches: `${REPORT}/matches`,
  /** `GET` one match: both scoreboards and the round strip. */
  reportMatch: (matchId: string): string => `${REPORT}/matches/${encodeURIComponent(matchId)}`,
  /** `GET` every squad round of the period. */
  reportRounds: `${REPORT}/rounds`,
  /** `GET` the sheet of one round: timeline, positions, economy. */
  reportRound: (matchId: string, roundNumber: number): string =>
    `${REPORT}/rounds/${encodeURIComponent(matchId)}/${roundNumber}`,
  /** `GET` deaths, kills and plants of the period on one map. */
  reportMinimap: (map: string): string => `${REPORT}/minimap/${encodeURIComponent(map)}`,
  // Findings and detections views.
  /** `GET` strengths and weaknesses tested against the references. */
  reportFindings: `${REPORT}/findings`,
  /** `GET` repetitions, biggest gaps and links found in the period. */
  reportDetections: `${REPORT}/detections`,
  // Players, trend and distribution views.
  /** `GET` squad players of the period, for the player picker. */
  reportPlayers: `${REPORT}/players`,
  /** `GET` the sheet of one squad player in the period. */
  reportPlayer: (name: string): string => `${REPORT}/players/${encodeURIComponent(name)}`,
  /** `GET` squad and player figures over the whole history (the period is highlighted). */
  reportTrends: `${REPORT}/trends`,
  /** `GET` histograms of the period against top ranked. */
  reportDistributions: `${REPORT}/distributions`,
  /** `GET` collected matches and last facts rebuild, per source. */
  status: `${API}/status`,
} as const;
