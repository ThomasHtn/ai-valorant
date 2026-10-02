import { DuelMap, Rate, RateVsReference } from '@core/common/common.model';
import { BuyType, Cohort, Side } from '@core/common/enums.model';

export interface KpiRate {
  current: Rate;
  /** Same rate over the comparison period; null without matches to compare with. */
  previous: Rate | null;
}

export interface TeamKpis {
  comparisonLabel: string;
  wins: number;
  losses: number;
  roundsWon: KpiRate;
  attack: KpiRate;
  defense: KpiRate;
  pistols: Rate;
  firstBlood: KpiRate;
  kast: KpiRate;
  tradedDeaths: Rate;
}

export interface FormPoint {
  matchId: string;
  startedAt: string;
  mapName: string;
  roundsWon: number;
  roundsLost: number;
}

export interface MapPoolRow {
  mapName: string;
  matches: number;
  wins: number;
  losses: number;
  rounds: Rate;
  attack: Rate;
  defense: Rate;
  pistols: Rate;
  firstBlood: Rate;
  postPlant: Rate;
  retake: Rate;
}

export interface SideRate {
  side: Side;
  squad: Rate;
  top: Rate;
}

export interface PistolFollowUp {
  pistolWon: boolean;
  roundsAfter: number;
  squad: Rate;
  top: Rate;
}

export interface BuyMatchup {
  ownBuy: BuyType;
  oppBuy: BuyType;
  squad: Rate;
  top: Rate;
}

export interface BuyShare {
  cohort: Cohort;
  eco: Rate;
  force: Rate;
  full: Rate;
}

export interface Economy {
  pistols: SideRate[];
  afterPistol: PistolFollowUp[];
  buyMatrix: BuyMatchup[];
  buyShares: BuyShare[];
}

export interface OpeningSide {
  side: Side;
  firstBlood: Rate;
  convert: RateVsReference;
  recover: RateVsReference;
  medianFirstKillS: number | null;
}

export interface OpeningPlayer {
  name: string;
  firstBloods: number;
  wonAfterFirstBlood: Rate;
  firstDeaths: number;
  wonAfterFirstDeath: Rate;
  firstDeathsTraded: Rate;
}

export interface Opening {
  sides: OpeningSide[];
  duelMaps: DuelMap[];
  topConvert: Rate;
  topRecover: Rate;
  players: OpeningPlayer[];
}

export interface StateRow {
  state: string;
  squad: Rate;
  top: Rate;
}

export interface Situations {
  states: StateRow[];
  throws: RateVsReference;
  comebacks: RateVsReference;
}

export interface SiteRow {
  mapName: string;
  site: string;
  plantShare: Rate;
  topPlantShare: Rate | null;
  postPlant: RateVsReference;
  plantsAgainstShare: Rate;
  retake: RateVsReference;
}

export interface TempoRow {
  label: string;
  share: Rate;
  topShare: Rate;
  won: Rate;
  topWon: Rate;
}

export interface PlantNumbersRow {
  label: string;
  postPlant: Rate;
  topPostPlant: Rate;
  retake: Rate;
  topRetake: Rate;
}

export interface Sites {
  rows: SiteRow[];
  tempo: TempoRow[];
  numbersAtPlant: PlantNumbersRow[];
}

export interface ClutchRow {
  cohort: Cohort;
  /** 1v1, 1v2, 1v3, 1v4 and more. */
  versus: Rate[];
}
