import { MatchLink, Noun, Rate, RoundRef } from '@core/common/common.model';
import { FindingStatus, Side, Tone } from '@core/common/enums.model';

/** How one match's figure reads: '3 throws sur 5 rounds à 2 joueurs d'avance'. */
export interface MatchWording {
  counted: Noun;
  tries: Noun;
}

/** A match a point is built on, with the point's own figure in that match. */
export interface FindingMatch extends MatchLink {
  rate: Rate;
}

/**
 * A gap between the squad (or one player) and its opponents (or 50 %), with the top ranked rate
 * alongside. `scope` is a map and side for the team, the player's name otherwise.
 */
export interface Finding {
  scope: string;
  metric: string;
  label: string;
  tone: Tone;
  status: FindingStatus;
  /** True when the label and every rate count the failures of the stat ('Premiers duels perdus'). */
  inverted: boolean;
  unit: string;
  /** What one match's count and total stand for ("3 throws sur 5 rounds à 2 joueurs d'avance"). */
  counted: Noun;
  tries: Noun;
  squad: Rate;
  /** Opponents' rate; null when the squad is tested against 50 %. */
  reference: Rate | null;
  /** Top ranked rate on the same map and side, beside the test. */
  top: Rate | null;
  rewatch: RoundRef[];
  /** Matches the squad figure comes from, oldest first. */
  matches: FindingMatch[];
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
  /** Metric key of a finding; null for the first-death spot. */
  metric: string | null;
  label: string;
  tone: Tone;
  /** True when the label and every rate count the failures of the stat ('Premiers duels perdus'). */
  inverted: boolean;
  /** What the figure counts ('rounds', 'morts', 'duels', 'first deaths'). */
  unit: string;
  /** What the count of one match's figure counts, as in '3 throws sur 5'. */
  counted: Noun;
  /** What the total of one match's figure counts ("sur 5 rounds à 2 joueurs d'avance"). */
  tries: Noun;
  squad: Rate | null;
  reference: Rate | null;
  top: Rate | null;
  matches: FindingMatch[];
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
