import { Rate, RoundRef } from '@core/common/common.model';
import { FindingStatus, Side, Tone } from '@core/common/enums.model';

export interface FindingPlayer {
  name: string;
  rate: Rate;
  rewatch: RoundRef[];
}

/**
 * A gap between the squad and its opponents (or 50 %). A single finding has a `scope` and a
 * `squad` rate; a finding shared by several players lists them in `players` instead.
 */
export interface Finding {
  scope: string | null;
  metric: string;
  label: string;
  tone: Tone;
  status: FindingStatus;
  unit: string;
  squad: Rate | null;
  /** Opponents' rate; null when the squad is tested against 50 %. */
  reference: Rate | null;
  players: FindingPlayer[];
  rewatch: RoundRef[];
}

export interface TeamFindings {
  weakTeam: Finding[];
  weakPlayers: Finding[];
  strongTeam: Finding[];
  strongPlayers: Finding[];
}

/** One line of the "À retenir" box. */
export interface SummaryItem {
  scope: string;
  label: string;
  tone: Tone;
  squad: Rate | null;
  reference: Rate | null;
}

export interface SpotPlayer {
  name: string;
  count: number;
}

/** A callout where the squad keeps dying first. */
export interface RecurringSpot {
  mapName: string;
  side: Side;
  callout: string;
  count: number;
  revenges: number;
  players: SpotPlayer[];
  rewatch: RoundRef[];
}

export interface EvolutionLine {
  scope: string;
  label: string;
  current: Rate;
  previous: Rate;
  better: boolean;
  significant: boolean;
}

export interface Evolution {
  comparisonLabel: string;
  hasPrevious: boolean;
  lines: EvolutionLine[];
}

/** Rounds to rewatch for one point, under the player they concern when there is one. */
export interface RewatchGroup {
  who: string | null;
  /** '30/09 Split R14' references. */
  rounds: string[];
}
