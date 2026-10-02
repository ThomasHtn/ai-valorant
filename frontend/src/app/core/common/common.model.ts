/**
 * Building blocks shared by every response. The API sends raw counts; formatting and colouring
 * happen in the front end (see `core/format`).
 */

import { Side } from './enums.model';

/** `count` successes out of `total` tries; `value` is null when there was no try. */
export interface Rate {
  count: number;
  total: number;
  value: number | null;
}

/** A squad rate next to the rate of a reference group (opponents or top ranked). */
export interface RateVsReference {
  squad: Rate;
  reference: Rate | null;
}

/** A squad rate, its reference, and the value its colour is centred on. */
export interface CenteredRate extends RateVsReference {
  center: number;
}

export interface LabelledRate {
  label: string;
  rate: Rate;
}

/** A squad match and the evening it belongs to, whose day is the session page's address. */
export interface MatchLink {
  matchId: string;
  sessionDay: string;
  startedAt: string;
  mapName: string;
  roundsWon: number;
  roundsLost: number;
}

/** A round to rewatch. */
export interface RoundRef {
  matchId: string;
  startedAt: string;
  mapName: string;
  roundNumber: number;
}

/** Position on the minimap image, both axes from 0 to 1. */
export interface MinimapPoint {
  x: number;
  y: number;
}

/** Opening duels on a minimap: won at the killer's position, lost at the victim's. */
export interface DuelMap {
  mapName: string;
  minimapUrl: string;
  side: Side | null;
  won: MinimapPoint[];
  lost: MinimapPoint[];
}

export interface MatchRecord {
  matches: number;
  wins: number;
  losses: number;
  rounds: Rate;
}

/** A word in the singular and the plural, to agree with a count ('1 throw', '3 throws'). */
export interface Noun {
  one: string;
  many: string;
}
