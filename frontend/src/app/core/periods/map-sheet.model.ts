import { CenteredRate, DuelMap, Rate, RoundRef } from '@core/common/common.model';
import { Side } from '@core/common/enums.model';
import { Finding } from './findings.model';
import { Composition } from './insights.model';

export interface MapKpi {
  /** Stable identifier, see `MAP_KPI_HELP`. */
  key: string;
  label: string;
  squad: Rate;
  /** Null when the map is out of the top ranked pool. */
  top: Rate | null;
}

export interface MapSiteRow {
  site: string;
  share: Rate;
  topShare: Rate | null;
  /** Post-plant won (attack) or retake won (defense). */
  result: CenteredRate;
}

export interface FirstDeathSpot {
  callout: string;
  firstDeaths: number;
  firstBloods: number;
}

export interface MapSide {
  side: Side;
  sites: MapSiteRow[];
  convert: CenteredRate;
  recover: CenteredRate;
  noPlant: Rate;
  topNoPlant: Rate | null;
  duelMap: DuelMap;
  firstDeathSpots: FirstDeathSpot[];
}

export interface TopComposition {
  agents: string[];
  share: Rate;
  wins: Rate;
}

export interface AgentPresence {
  agent: string;
  presence: Rate;
  wins: Rate;
}

export interface MapCompositionsDetail {
  squad: Composition[];
  top: TopComposition[];
  topAgents: AgentPresence[];
}

export interface MapPlayerRow {
  name: string;
  mainAgent: string;
  matches: number;
  acs: number | null;
  kd: number | null;
  adr: number | null;
  kast: number | null;
  firstBloods: number;
  firstDeaths: number;
  impact: number | null;
}

export interface MapSheet {
  mapName: string;
  minimapUrl: string;
  matches: number;
  wins: number;
  losses: number;
  rounds: number;
  topMatches: number;
  hasTopReference: boolean;
  kpis: MapKpi[];
  findings: Finding[];
  sides: MapSide[];
  compositions: MapCompositionsDetail;
  players: MapPlayerRow[];
  throws: number;
  throwRewatch: RoundRef[];
}
