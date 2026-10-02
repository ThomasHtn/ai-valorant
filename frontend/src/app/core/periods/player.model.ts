import { DuelMap, LabelledRate, Rate } from '@core/common/common.model';
import { Cohort, Side, Tone } from '@core/common/enums.model';

export interface RosterRow {
  puuid: string;
  name: string;
  /** Whether the player played enough rounds in the period to get a profile. */
  hasProfile: boolean;
  matches: number;
  acs: number | null;
  kd: number | null;
  adr: number | null;
  kast: number | null;
  headshots: number | null;
  firstBloods: number;
  firstDeaths: number;
  opening: number | null;
  traded: number | null;
  impact: number | null;
}

export interface HeadlineValue {
  value: number | null;
  /** Same stat over the comparison period, or the player's usual level. */
  previous: number | null;
}

export interface PlayerHeadline {
  acs: HeadlineValue;
  kd: number | null;
  adr: HeadlineValue;
  kast: HeadlineValue;
  headshots: HeadlineValue;
  firstBloods: number;
  firstDeaths: number;
  impact: HeadlineValue;
}

export interface StatGap {
  key: string;
  label: string;
  value: number;
  reference: number;
  referenceGroup: Cohort;
  tone: Tone;
}

export interface StatComparison {
  key: string;
  value: number | null;
  opponents: number | null;
  top: number | null;
  versusOpponents: Tone;
  versusTop: Tone;
}

export interface AgentShare {
  agent: string;
  share: Rate;
}

export interface PlayerFormPoint {
  matchId: string;
  startedAt: string;
  mapName: string;
  agent: string;
  acs: number;
  kills: number;
  deaths: number;
}

export interface RoundImpact {
  baseline: Rate;
  rows: LabelledRate[];
}

export interface SplitRow {
  label: string;
  matches: number | null;
  wins: number | null;
  losses: number | null;
  rounds: number;
  acs: number | null;
  kd: number | null;
  adr: number | null;
  kast: number | null;
  firstBloods: number;
  firstDeaths: number;
  impact: number | null;
}

export interface WeaponRow {
  weapon: string;
  rounds: number;
  killsPerRound: number;
  topKillsPerRound: number | null;
  adr: number;
  roundsWon: Rate;
}

export interface DeathSpotRow {
  mapName: string;
  side: Side;
  callout: string;
  deaths: number;
  share: Rate;
  early: Rate;
}

export interface ClutchSummary {
  /** 1v1 to 1v5. */
  versus: Rate[];
  totalUpToThree: Rate;
}

export interface AbilityUse {
  ability: string;
  perRound: number;
  topPerRound: number | null;
  underUsed: boolean;
}

export interface UtilityRow {
  agent: string;
  matches: number;
  abilities: AbilityUse[];
}

export interface PlayerProfile {
  puuid: string;
  name: string;
  comparisonLabel: string;
  matches: number;
  wins: number;
  losses: number;
  rounds: number;
  agents: AgentShare[];
  headline: PlayerHeadline;
  strengths: StatGap[];
  weaknesses: StatGap[];
  stats: StatComparison[];
  form: PlayerFormPoint[];
  topReferenceAcs: number | null;
  roundImpact: RoundImpact;
  bySide: SplitRow[];
  byAgent: SplitRow[];
  byMap: SplitRow[];
  weapons: WeaponRow[];
  deathSpots: DeathSpotRow[];
  clutches: ClutchSummary;
  utility: UtilityRow[];
  duelMaps: DuelMap[];
}
