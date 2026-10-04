import { BuyType, LossCause, Side } from '@core/common/enums.model';

/** Mirrors `backend/src/valostats/schemas/report/rounds.py`. */

/** One squad round, as listed in the Rounds view and at the top of its sheet. */
export interface RoundLine {
  matchId: string;
  /** 1-based, as shown in game. */
  roundNumber: number;
  /** Day of the evening the match belongs to. */
  day: string;
  startedAt: string;
  mapName: string;
  side: Side;
  buy: BuyType;
  oppBuy: BuyType;
  /** Score of the match right before the round ('7-8'). */
  scoreBefore: string;
  won: boolean;
  result: string;
  cause: LossCause | null;
  maxAdvantage: number;
  /** Best live situation of the round ('5v3') and the squad's chance of winning from it. */
  bestState: string | null;
  bestProbability: number | null;
  /** Largest fall of the squad's chance in one event (0..1), the round's end included. */
  maxDrop: number;
  /** Lost after the squad's chance reached 70 % (backend THROW_MIN_CHANCE). */
  thrown: boolean;
}

/** Every squad round of the period, newest first; every round has a sheet. */
export interface RoundIndex {
  rounds: RoundLine[];
}

export type EventKind = 'kill' | 'plant' | 'defuse';

/** A player on the minimap (0..1); `alive` is false for the victim of the event. */
export interface PlayerPosition {
  name: string;
  squad: boolean;
  x: number;
  y: number;
  alive: boolean;
}

export interface RoundEvent {
  ms: number;
  kind: EventKind;
  /** French sentence shown as is ('Psilonnix tue ka7ba à A Main (Vandal)'). */
  text: string;
  actor: string;
  target: string | null;
  weapon: string | null;
  zone: string | null;
  /** The actor plays for the squad. */
  squadActor: boolean;
  ownAlive: number;
  oppAlive: number;
  /** Squad chance of winning the round right after the event (top ranked table). */
  winProbability: number;
  /** Players alive at this moment plus the victim. */
  positions: PlayerPosition[];
}

export interface EconomyLine {
  name: string;
  agent: string;
  loadout: number;
  weapon: string | null;
  armor: string | null;
  remaining: number;
}

export interface RoundSheet {
  round: RoundLine;
  events: RoundEvent[];
  /** Clockwise turn of the minimap (0, 90, 180, 270) so attackers start at the bottom. */
  rotation: number;
  squadEconomy: EconomyLine[];
  oppEconomy: EconomyLine[];
}

/** A round address: its match and its 1-based number. */
export interface RoundRef {
  matchId: string;
  roundNumber: number;
}
