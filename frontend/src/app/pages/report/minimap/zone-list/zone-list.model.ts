import { ZoneRow } from '@core/report/minimap.model';

/** How a zone's first-death share compares with the top ranked. */
export type ZoneTone = 'over' | 'under' | 'even';

/** One death of a player in a zone: 'R8', opening the round sheet. */
export interface ZoneRoundChip {
  key: string;
  label: string;
  commands: string[];
  firstDeath: boolean;
}

/** A player's deaths in a zone from one match: '01/10' opens the match, then one chip per round. */
export interface ZoneMatchGroup {
  key: string;
  label: string;
  commands: string[];
  rounds: ZoneRoundChip[];
}

/** Who died in a zone and in which rounds. */
export interface ZonePlayerLine {
  name: string;
  groups: ZoneMatchGroup[];
  /** Deaths beyond the chips shown. */
  more: number;
}

/** A zone ready to draw as one bar row of the list. */
export interface ZoneLine {
  row: ZoneRow;
  players: ZonePlayerLine[];
  /** Squad share of the side's first deaths in the zone: '18 %'. */
  share: string;
  /** '5 sur 28 first deaths'. */
  count: string;
  /** 'Top ranked 11 %', or why there is none. */
  top: string;
  /** Bar width and top ranked tick, in % of the list's largest share. */
  bar: number;
  tick: number | null;
  tone: ZoneTone;
  /** Deaths, kills and revenge in the zone, written once the row is open. */
  summary: string;
}

/** The sentence over the zones: what to look at, or why nothing can be said yet. */
export interface ZoneVerdict {
  text: string;
  /** True when it names zones to work on. */
  alert: boolean;
}
