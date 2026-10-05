/** Stratégie view of one map (`GET /report/strategy/{map}`): what the top ranked play, and why they win more rounds. */

import { DensityCell, MinimapCallout } from './minimap.model';
import { Rate } from './rate.model';

/** A composition; `rounds` counts rounds won over rounds played. */
export interface CompLine {
  agents: string[];
  matches: number;
  /** Share of the cohort's team-matches on the map. */
  share: number;
  rounds: Rate;
}

export interface AgentPick {
  agent: string;
  role: string;
  /** Share of top ranked team-matches on the map with this agent. */
  share: number;
  /** Played by the squad on this map in the period. */
  squad: boolean;
}

/**
 * How often a team does something and what it is worth: top ranked round win rates with and
 * without it, and the rounds per match the squad wins (+) or loses (-) by its own habit.
 */
export interface Habit {
  key: string;
  label: string;
  /** What the share counts: 'premières morts tradées'. */
  detail: string;
  top: Rate;
  squad: Rate;
  wonIf: number | null;
  wonElse: number | null;
  cost: number | null;
}

/** Plants on one site: share of the plants, and post-plant rounds won there. */
export interface SiteShare {
  site: string;
  top: Rate;
  squad: Rate;
  topWon: Rate;
  squadWon: Rate;
}

/** Where the defense meets the first duel: share of opening duels, and duels won there. */
export interface ContactZone {
  zone: string;
  top: Rate;
  squad: Rate;
  topWon: Rate;
  squadWon: Rate;
}

export interface SquadPlant {
  x: number;
  y: number;
  site: string | null;
  won: boolean;
}

export interface StrategyView {
  mapName: string;
  minimapUrl: string;
  callouts: MinimapCallout[];
  topMatches: number;
  patches: string[];
  squadMatches: Rate;
  comps: CompLine[];
  /** The squad's most played composition on the map, null when it did not play it. */
  squadComp: CompLine | null;
  agents: AgentPick[];
  habits: Habit[];
  sites: SiteShare[];
  topPlants: DensityCell[];
  squadPlants: SquadPlant[];
  contacts: ContactZone[];
}
