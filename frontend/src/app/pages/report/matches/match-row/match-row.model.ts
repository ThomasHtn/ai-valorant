import { HoverTipContent } from '@shared/hover-tip/hover-tip.model';

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
  /** 'getjfox (Cypher) : 223 ACS, 12/15', the debrief cards' native tip. */
  title: string;
  /** Tip of the Matchs list portrait: who played the agent and how. */
  tip: HoverTipContent;
  /** Portrait URL, null when the agent has no known art. */
  portrait: string | null;
}

/** A match of the list, ready to draw. */
export interface MatchRowView {
  matchId: string;
  mapName: string;
  /** '21h14, 25 min'. */
  when: string;
  won: boolean;
  /** '13-11', squad first. */
  score: string;
  roundsWon: number;
  roundsLost: number;
  /** Round strip of the debrief cards; the Matchs list leaves it out. */
  squares: MiniSquare[];
  digest: MatchDigest;
  /** Best ACS first. */
  lineup: LineupView[];
}
