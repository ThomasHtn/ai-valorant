import { MinimapPoint, Rate } from '@core/common/common.model';
import { Side, Tone } from '@core/common/enums.model';
import { HeadlineValue, RosterRow } from '@core/periods/player.model';

export interface SessionListItem {
  day: string;
  matches: number;
  wins: number;
  losses: number;
  maps: string[];
}

/** A recurring mistake or an unusual result of one match, as French text. */
export interface SessionPoint {
  side: Side;
  tone: Tone;
  title: string;
  detail: string;
}

export interface TimelineStep {
  timeMs: number;
  kind: 'death' | 'kill' | 'plant';
  text: string;
  state: string;
  turning: boolean;
}

export interface SnapshotPlayer {
  name: string;
  squad: boolean;
  position: MinimapPoint;
}

/** Every player alive right after a kill. */
export interface KillSnapshot {
  mapName: string;
  minimapUrl: string;
  victim: MinimapPoint;
  victimSquad: boolean;
  killer: MinimapPoint | null;
  players: SnapshotPlayer[];
}

/** A round lost after the squad was clearly favoured. */
export interface CostlyRound {
  roundNumber: number;
  side: Side;
  buy: string;
  bestChance: number;
  headline: string;
  notes: string[];
  state: string;
  timeMs: number;
  steps: TimelineStep[];
  turningLabel: string | null;
  snapshot: KillSnapshot | null;
}

export interface ScoreboardRow {
  name: string;
  agent: string;
  kills: number;
  deaths: number;
  assists: number;
  acs: number | null;
  adr: number | null;
  kast: number | null;
  firstBloods: number;
  firstDeaths: number;
  impact: number | null;
}

export interface SessionMatch {
  matchId: string;
  mapName: string;
  startedAt: string;
  roundsWon: number;
  roundsLost: number;
  attack: Rate;
  defense: Rate;
  scoreboard: ScoreboardRow[];
  recurring: SessionPoint[];
  unusual: SessionPoint[];
  costlyRounds: CostlyRound[];
}

export interface SessionHighlight {
  mapName: string;
  title: string;
  side: Side | null;
  roundNumber: number | null;
  state: string | null;
}

export interface VersusUsualRow {
  name: string;
  acs: HeadlineValue;
  adr: HeadlineValue;
  kast: HeadlineValue;
  impact: HeadlineValue;
}

export interface SessionReport {
  day: string;
  month: string;
  matches: SessionMatch[];
  highlights: SessionHighlight[];
  roster: RosterRow[];
  versusUsual: VersusUsualRow[];
}
