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

/** A zone row ready to draw. */
export interface ZoneLine {
  row: ZoneRow;
  players: ZonePlayerLine[];
  /** False when nobody of the squad and almost no top ranked died first there: the comparison cells stay empty. */
  compared: boolean;
  share: string;
  /** '1 sur 3': the zone's first deaths out of the side's. */
  sample: string;
  topShare: string;
  /** '+11 pts', or '–' without a top ranked share. */
  excess: string;
  tone: ZoneTone;
  revenge: string;
}

/** The sentence over the zones: what to look at, or why nothing can be said yet. */
export interface ZoneVerdict {
  text: string;
  /** True when it names zones to work on. */
  alert: boolean;
}
