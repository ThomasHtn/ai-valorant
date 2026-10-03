import { MatchDigest } from '../match-digest/match-digest.model';

/** A square of a mini strip: a round won or lost, or the gap of a side swap. */
export interface MiniSquare {
  key: string;
  won: boolean | null;
}

/** A squad player of the match, ready to draw. */
export interface LineupView {
  name: string;
  agent: string;
  /** Rounded ACS. */
  acs: number;
  /** 'getjfox (Cypher) : 223 ACS, 12/15'. */
  title: string;
}

/** A match of the list, ready to draw. */
export interface MatchRowView {
  matchId: string;
  mapName: string;
  /** '21h14 · 25 min'. */
  when: string;
  won: boolean;
  score: string;
  squares: MiniSquare[];
  digest: MatchDigest;
  /** Best ACS first. */
  lineup: LineupView[];
}
