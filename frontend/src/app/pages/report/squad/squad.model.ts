import { HoverTipContent } from '@shared/hover-tip/hover-tip.model';

/** How a gap in rounds reads: green, red, white under half a round, grey on a thin sample. */
export type DashTone = 'good' | 'bad' | 'flat' | 'thin';

/** A gap in rounds as its pill writes it: '−11,5', stronger ground past 3 rounds. */
export interface RoundsPill {
  text: string;
  tone: DashTone;
  strong: boolean;
  /** 'rounds' from 2 on, 'round' under. */
  unit: string;
}

/** Which map a table names beside each line: where it costs most, or where it pays most. */
export type MapPickMode = 'worst' | 'best';

/** The map a line names, with every map in its tip. */
export interface MapPick {
  map: string | null;
  rounds: string;
  tone: DashTone;
  tip: HoverTipContent | null;
}

/** One map of a situation, painted by its gap in rounds. */
export interface MapCell {
  map: string;
  /** '−4,3', or '–' on a thin sample. */
  text: string;
  tone: DashTone;
  strong: boolean;
  tip: HoverTipContent;
}

/** Habit of the squad (red on many maps) or one map's problem, read from the map cells. */
export interface HabitReading {
  kind: 'habit' | 'map' | 'none';
  /** 'Habitude, 5 cartes sur 7', 'Surtout Split'. */
  text: string;
}

/** One player in an expanded situation line. */
export interface SituationPlayerLine {
  name: string;
  portrait: string;
  played: number;
  rate: string;
  top: string;
  tone: DashTone;
  rounds: RoundsPill;
  tip: HoverTipContent;
}

/** A link to the Rounds view listing this line's lost rounds, when its filters can say it exactly. */
export interface RewatchLink {
  label: string;
  params: Record<string, string>;
}

/** One line of a situation table: a situation or a buy against the top ranked. */
export interface SituationLine {
  key: string;
  label: string;
  /** What is counted, in the label's tip. */
  tip: HoverTipContent | null;
  played: number;
  won: number;
  /** Squad rate, '41 %'. */
  rate: string;
  /** Both rates with their samples and the gap, on the rate and the rounds. */
  gapTip: HoverTipContent;
  top: string;
  /** Rate minus top ranked rate, '−4 pts'. */
  points: string;
  tone: DashTone;
  rounds: RoundsPill;
  thin: boolean;
  pick: MapPick | null;
  /** What the expanded line shows: map by map, player by player, and the rounds to rewatch. */
  maps: MapCell[];
  reading: HabitReading;
  players: SituationPlayerLine[];
  rewatch: RewatchLink | null;
}

/** One row of the habit grid: a priority, map by map, and what it reads as. */
export interface HabitRow {
  key: string;
  label: string;
  rounds: RoundsPill;
  cells: MapCell[];
  reading: HabitReading;
}

/** Change of a headline rate against the period before, '−1,4 pt'. */
export interface KpiDelta {
  text: string;
  tone: DashTone;
  direction: 'up' | 'down' | 'flat';
}

/** A headline card: a big ring, its label, what it rests on, and its change. */
export interface RingKpi {
  key: string;
  label: string;
  help: string | null;
  /** Share drawn by the ring, 0..1; null when nothing was played. */
  share: number | null;
  /** Percent in the middle, '44'. */
  value: string;
  tone: DashTone;
  /** Top ranked share, marked by a white tick. */
  mark: number | null;
  sub: string;
  delta: KpiDelta | null;
}

/** Lost rounds split by who took the first kill. */
export interface LostSplit {
  lost: number;
  afterDeath: number;
  despiteBlood: number;
  /** '27 %' rattrapés and its top ranked rate. */
  recoveryRate: string;
  recoveryTop: string;
  conversionRate: string;
  conversionTop: string;
}

/** Share of the played rounds per buy, for the economy donut. */
export interface BuyShare {
  key: string;
  label: string;
  rounds: number;
  share: string;
  color: string;
}

export type VerdictKey = 'solid' | 'stabilize' | 'work' | 'test' | 'collecting';

/** One side of a map, or of every map: rate, sample and top ranked rate. */
export interface SideCells {
  rate: string;
  tip: HoverTipContent;
  /** '22 sur 52'. */
  volume: string;
  top: string;
  tone: DashTone;
  /** Squad rate 0..1, for the dumbbell; null without rounds. */
  share: number | null;
  rounds: RoundsPill;
}

export interface MapLine {
  map: string;
  matches: number;
  wins: number;
  losses: number;
  /** Matches, wins and rounds, behind the record. */
  recordTip: HoverTipContent;
  /** Gap split by side, behind the rounds. */
  roundsTip: HoverTipContent;
  attack: SideCells;
  defense: SideCells;
  rounds: RoundsPill;
  verdict: VerdictKey;
  thin: boolean;
}

/** One painted site cell; null when the map has no such site. */
export interface SiteCell {
  rounds: string;
  tone: DashTone;
  strong: boolean;
  tip: HoverTipContent;
}

/** One map of the post-plant or retake grid: a cell per site, then the whole map. */
export interface SiteMapLine {
  map: string;
  sites: (SiteCell | null)[];
  rounds: RoundsPill;
  /** The whole map: rates, samples and gap. */
  tip: HoverTipContent;
}

/** Head of the post-plant or retake card: the big ring and its sentence. */
export interface SpikeHead {
  share: number | null;
  value: string;
  tone: DashTone;
  mark: number | null;
  /** '125 gagnés sur 173, top ranked 74 %'. */
  sub: string;
  rounds: RoundsPill;
}

/** One roster figure, coloured against the top ranked. */
export interface RosterCell {
  key: string;
  text: string;
  tone: DashTone;
  /** The player against the top ranked, his opponents and his history. */
  tip: HoverTipContent;
}

export interface RosterRow {
  name: string;
  portrait: string;
  matches: number;
  /** ACS month by month, and the top ranked ACS for the dashed line. */
  acsMonths: (number | null)[];
  acsTop: number | null;
  /** Each month's ACS against the top ranked. */
  acsTip: HoverTipContent;
  cells: RosterCell[];
}
