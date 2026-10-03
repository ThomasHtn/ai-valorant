import { BuyType, LossCause, Side } from '@core/common/enums.model';

/** Mirrors `backend/src/valostats/schemas/report/matches.py`. */

/** A squad player of one match, as the match list sums him up. */
export interface LineupLine {
  name: string;
  agent: string;
  acs: number;
  kills: number;
  deaths: number;
}

export interface MatchSummary {
  matchId: string;
  startedAt: string;
  mapName: string;
  won: boolean;
  roundsWon: number;
  roundsLost: number;
  lengthMs: number | null;
  /** Rounds where the squad got the first kill, and where it suffered it. */
  openingWon: number;
  openingLost: number;
  /** Squad players, best ACS first. */
  lineup: LineupLine[];
}

/** An evening (session): its day and its matches, oldest first. */
export interface EveningMatches {
  day: string;
  wins: number;
  losses: number;
  matches: MatchSummary[];
}

/** Evenings of the period, newest first. */
export interface MatchList {
  evenings: EveningMatches[];
}

export interface ScoreboardLine {
  name: string;
  agent: string;
  /** Henrik's English tier name ('Platinum 1'); `app-rank-icon` shows the icon and the French name. */
  rank: string | null;
  acs: number;
  kills: number;
  deaths: number;
  assists: number;
  adr: number;
  kast: number | null;
  headshotRate: number | null;
  firstBloods: number;
  firstDeaths: number;
}

/** One round of the match strip, seen from the squad. */
export interface RoundStripCell {
  roundNumber: number;
  side: Side;
  won: boolean;
  buy: BuyType;
  oppBuy: BuyType;
  result: string;
  ceremony: string | null;
  cause: LossCause | null;
  maxAdvantage: number;
  planted: boolean;
  plantSite: string | null;
}

export interface MatchDetail {
  matchId: string;
  /** Day of the evening the match belongs to. */
  day: string;
  startedAt: string;
  mapName: string;
  patch: string;
  won: boolean;
  roundsWon: number;
  roundsLost: number;
  startSide: Side;
  lengthMs: number | null;
  cluster: string | null;
  tier: number | null;
  oppTier: number | null;
  /** Best ACS first. */
  squad: ScoreboardLine[];
  opponents: ScoreboardLine[];
  rounds: RoundStripCell[];
}
