import { Side } from '@core/common/enums.model';
import { ValueFormat } from '@core/format/value-format.model';

import { StatCell, StatTable } from './stat-table.model';

/**
 * Joueurs view (`GET /report/players`, `GET /report/players/{name}`), mirror of
 * `backend/src/valostats/schemas/report/player.py`. Top ranked and opponent references of a player are
 * players of his main role; his history is himself before the period.
 */

/** A squad player of the period, for the player picker. */
export interface PlayerSummary {
  name: string;
  puuid: string;
  mainAgent: string;
  /** English role ('Duelist'...), translated with `ROLE_LABELS`. */
  role: string;
  /** Latest competitive tier of the period ('Platinum 1'), null when unranked. */
  rank: string | null;
  matches: number;
  rounds: number;
}

/** One tile of the headline band. */
export interface HeadlineStat {
  key: string;
  label: string;
  format: ValueFormat;
  /** 1 higher is better, -1 lower is better. */
  better: number;
  help: string;
  /** Sample under which the tile stays grey. */
  min: number;
  cell: StatCell;
}

export interface AgentPlayed {
  agent: string;
  matches: number;
}

/** One of the weapons the player kills most with. */
export interface WeaponUse {
  weapon: string;
  kills: number;
  /** Share of the player's kills. */
  share: number;
  /** Headshot rate in the rounds he bought this weapon (Henrik has no weapon per shot). */
  headshotRate: number | null;
  shots: number;
  /** Median kill distance in metres. */
  distance: number | null;
}

/** A death in a zone, with the round to rewatch. */
export interface ZoneDeath {
  matchId: string;
  startedAt: string;
  mapName: string;
  roundNumber: number;
  side: Side;
  firstDeath: boolean;
}

/** A zone where the player dies often, on one map. */
export interface DeathZone {
  mapName: string;
  zone: string;
  deaths: number;
  /** Share of all his deaths. */
  share: number;
  firstDeaths: number;
  firstDeathShare: number;
  rounds: ZoneDeath[];
}

export interface OpeningDuels {
  firstBloods: number;
  firstDeaths: number;
  /** First bloods / (first bloods + first deaths). */
  duelsWon: StatCell;
  wonAfterFirstBlood: StatCell;
  wonAfterFirstDeath: StatCell;
}

/** Clutches of one size ('1v1', '1v2', '1v3+'). */
export interface ClutchLine {
  situation: string;
  won: number;
  played: number;
  cell: StatCell;
}

/** One match of the player, oldest first. */
export interface FormMatch {
  matchId: string;
  day: string;
  mapName: string;
  agent: string;
  acs: number;
  kills: number;
  deaths: number;
  assists: number;
  won: boolean;
  /** Squad score, e.g. '13-9'. */
  score: string;
  inPeriod: boolean;
}

/** A first death without revenge, with what killed the player. */
export interface RewatchRound {
  matchId: string;
  startedAt: string;
  mapName: string;
  roundNumber: number;
  zone: string;
  weapon: string | null;
  side: Side;
  killerAgent: string | null;
  /** Time of the death in the round. */
  seconds: number;
}

export interface PlayerSheet {
  name: string;
  puuid: string;
  mainAgent: string;
  role: string;
  rank: string | null;
  matches: number;
  rounds: number;
  agents: AgentPlayed[];
  headline: HeadlineStat[];
  byMap: StatTable;
  byAgent: StatTable;
  bySide: StatTable;
  weapons: WeaponUse[];
  deathZones: DeathZone[];
  openingDuels: OpeningDuels;
  clutches: ClutchLine[];
  form: FormMatch[];
  rewatch: RewatchRound[];
}
