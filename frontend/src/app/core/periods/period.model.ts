import { MatchLink } from '@core/common/common.model';

import { Evolution, RecurringSpot, SummaryItem, TeamFindings } from './findings.model';
import {
  Correlations,
  DriverGroup,
  MapCompositions,
  RevengeMatrix,
  SessionsContext,
} from './insights.model';
import { RosterRow } from './player.model';
import { ClutchRow, Economy, MapPoolRow, Opening, Sites, Situations, TeamKpis } from './team.model';

export interface AvailablePeriods {
  months: string[];
  patches: string[];
  firstDay: string | null;
  lastDay: string | null;
}

export interface PlayerLink {
  puuid: string;
  name: string;
  /** Most played agent over the period, for the player's portrait. */
  mainAgent: string;
}

/** What a period covers, to build the report's navigation. */
export interface PeriodOverview {
  key: string;
  title: string;
  comparisonLabel: string;
  matches: number;
  topReferenceMatches: number;
  maps: string[];
  players: PlayerLink[];
}

export interface TeamReport {
  summary: SummaryItem[];
  kpis: TeamKpis;
  /** Squad matches of the period, newest first. */
  matches: MatchLink[];
  mapPool: MapPoolRow[];
  findings: TeamFindings;
  roundDrivers: DriverGroup[];
  correlations: Correlations;
  economy: Economy;
  opening: Opening;
  situations: Situations;
  sites: Sites;
  clutches: ClutchRow[];
  revenge: RevengeMatrix;
  compositions: MapCompositions[];
  sessionsContext: SessionsContext;
  recurringSpots: RecurringSpot[];
  roster: RosterRow[];
  evolution: Evolution;
}
