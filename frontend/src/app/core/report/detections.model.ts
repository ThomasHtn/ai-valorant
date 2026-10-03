import { LossCause, Side } from '@core/common/enums.model';

import { Finding, RewatchRound } from './findings.model';
import { Rate } from './rate.model';
import { GameArt } from './stat-table.model';

/** Automatic detections, mirror of `backend/src/valostats/schemas/report/detections.py`. */

export type RepetitionKind = 'zone_first_deaths' | 'loss_cause' | 'situation_lost';

export interface PlayerCount {
  name: string;
  count: number;
}

/** The same thing happening again: first deaths in one zone, a cause of lost rounds, a lost situation. */
export interface Repetition {
  kind: RepetitionKind;
  /** '6 first deaths à A Stairs', shown as is. */
  label: string;
  /** 'Lotus · défense', or 'Toutes les cartes'. */
  scope: string;
  art: GameArt | null;
  mapName: string | null;
  side: Side | null;
  count: number;
  matches: number;
  /** Rounds of the scope the count rests on. */
  baseRounds: number;
  zone?: string | null;
  share?: number | null;
  topShare?: number | null;
  avenged?: number | null;
  players: PlayerCount[];
  cause?: LossCause | null;
  state?: string | null;
  lostShare?: number | null;
  oppLostShare?: number | null;
  oppRounds?: number | null;
  rewatch: RewatchRound[];
}

export type LinkKind = 'first_blood' | 'first_death' | 'acs_median';

/** Rounds the team won in a player's matches above (or below) his median ACS. */
export interface AcsGroup {
  rounds: Rate;
  matches: number;
  matchWins: number;
}

/** How the round result moves with what one player does. */
export interface Link {
  kind: LinkKind;
  player: string;
  art: GameArt;
  /** 'Rounds gagnés après son first blood', shown as is. */
  label: string;
  pValue: number;
  value?: Rate | null;
  team?: Rate | null;
  gapRounds?: number | null;
  medianAcs?: number | null;
  above?: AcsGroup | null;
  below?: AcsGroup | null;
  rewatch: RewatchRound[];
}

export interface Detections {
  repetitions: Repetition[];
  /** The biggest confirmed gaps. */
  gaps: Finding[];
  links: Link[];
}
