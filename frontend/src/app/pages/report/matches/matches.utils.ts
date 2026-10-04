import { LossCause } from '@core/common/enums.model';
import { throwLabel } from '@core/format/format.utils';
import { LOSS_CAUSE_LABELS, SIDE_LABELS } from '@core/format/labels.constants';
import {
  BUY_SENTENCE_LABELS,
  CEREMONY_LABELS,
  RESULT_LABELS,
} from '@core/format/round-labels.constants';
import { MatchList, MatchSummary, RoundStripCell } from '@core/report/matches.model';
import { roundLink } from '@core/report/round-ref.utils';
import { RoundLine } from '@core/report/rounds.model';
import { HoverTipContent } from '@shared/hover-tip/hover-tip.model';

/** Rounds of regulation; overtime then swaps sides every round. */
const HALF_LENGTH = 12;
const OVERTIME_START = 24;

/** A round of the strip, or the gap drawn where the teams swap sides. */
export type StripItem<T = RoundStripCell> =
  { kind: 'round'; cell: T } | { kind: 'swap'; key: string };

/** Rounds, in game order, with a gap at half time and at each side swap of the overtime. */
export function stripItems<T>(rounds: readonly T[]): StripItem<T>[] {
  const items: StripItem<T>[] = [];
  rounds.forEach((cell, index) => {
    if (index === HALF_LENGTH || (index >= OVERTIME_START && index % 2 === 0)) {
      items.push({ kind: 'swap', key: `swap-${index}` });
    }
    items.push({ kind: 'round', cell });
  });
  return items;
}

/** A match in the period's order (oldest first), with the evening it belongs to. */
export interface MatchInOrder {
  match: MatchSummary;
  day: string;
}

/** Every match of the period, oldest first; evenings come newest first from the API. */
export function matchesInOrder(list: MatchList | null | undefined): MatchInOrder[] {
  return [...(list?.evenings ?? [])]
    .reverse()
    .flatMap((evening) => evening.matches.map((match) => ({ match, day: evening.day })));
}

/** The matches played right before and after one, for the previous / next buttons. */
export function matchNeighbours(
  list: MatchList | null | undefined,
  matchId: string,
): { previous: MatchInOrder | null; next: MatchInOrder | null } {
  const ordered = matchesInOrder(list);
  const index = ordered.findIndex((m) => m.match.matchId === matchId);
  if (index < 0) {
    return { previous: null, next: null };
  }
  return { previous: ordered[index - 1] ?? null, next: ordered[index + 1] ?? null };
}

/**
 * Score gap after each round, from the squad's side: +2 after leading 4-2. The strip draws it as a
 * bar over each round, so the match's momentum reads along with its rounds.
 */
export function scoreGaps(rounds: readonly Pick<RoundStripCell, 'won'>[]): number[] {
  let gap = 0;
  return rounds.map((round) => (gap += round.won ? 1 : -1));
}

/** Rounds of the period grouped by match, in game order, for the mini strips of the match cards. */
export function roundsByMatch(rounds: readonly RoundLine[]): Map<string, RoundLine[]> {
  const byMatch = new Map<string, RoundLine[]>();
  for (const round of rounds) {
    const list = byMatch.get(round.matchId) ?? [];
    list.push(round);
    byMatch.set(round.matchId, list);
  }
  for (const list of byMatch.values()) {
    list.sort((a, b) => a.roundNumber - b.roundNumber);
  }
  return byMatch;
}

/** One bar of the "lost rounds by cause" list; `share` is relative to the most frequent cause. */
export interface CauseCount {
  cause: LossCause | null;
  label: string;
  count: number;
  share: number;
}

/** Lost rounds grouped by cause, most frequent first. */
export function lossCauseCounts(
  rounds: readonly Pick<RoundStripCell, 'won' | 'cause'>[],
): CauseCount[] {
  const counts = new Map<LossCause | null, number>();
  for (const round of rounds) {
    if (!round.won) {
      counts.set(round.cause, (counts.get(round.cause) ?? 0) + 1);
    }
  }
  const sorted = [...counts].sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] ?? 1;
  return sorted.map(([cause, count]) => ({
    cause,
    label: cause ? LOSS_CAUSE_LABELS[cause] : 'Sans cause',
    count,
    share: count / max,
  }));
}

/** A lost round of the match, as listed under the strip; the line opens its sheet in Rounds. */
export interface LostRoundRow {
  key: string;
  link: string[];
  number: string;
  detail: string;
  cause: string;
  /** 'Throw à 84 %' when the squad had the round in hand, else null. */
  chance: string | null;
}

/** Lost rounds of one match, in game order. */
export function lostRoundRows(rounds: readonly RoundLine[], matchId: string): LostRoundRow[] {
  return rounds
    .filter((round) => round.matchId === matchId && !round.won)
    .sort((a, b) => a.roundNumber - b.roundNumber)
    .map((round) => ({
      key: `r${round.roundNumber}`,
      link: roundLink(round),
      number: `R${round.roundNumber}`,
      detail: `${SIDE_LABELS[round.side]}, ${BUY_SENTENCE_LABELS[round.buy]} contre ${BUY_SENTENCE_LABELS[round.oppBuy]}`,
      cause: round.cause ? LOSS_CAUSE_LABELS[round.cause] : 'Sans cause',
      chance:
        round.thrown && round.bestProbability !== null ? throwLabel(round.bestProbability) : null,
    }));
}

/**
 * Tip of a round of the strip: side and buys, how it ended, the score after it when the gap is
 * known, its cause, best lead, ceremony.
 */
export function roundTip(round: RoundStripCell, gap: number | null = null): HoverTipContent {
  const lines = [
    {
      label: 'Fin',
      value: `${RESULT_LABELS[round.result] ?? round.result}${round.planted && round.plantSite ? `, plant en ${round.plantSite}` : ''}`,
    },
  ];
  if (gap !== null) {
    // Wins minus losses is the gap and wins plus losses the round number.
    const wins = (round.roundNumber + gap) / 2;
    lines.push({ label: 'Score', value: `${wins}-${round.roundNumber - wins}` });
  }
  if (round.cause) {
    lines.push({ label: 'Cause', value: LOSS_CAUSE_LABELS[round.cause] });
  }
  if (round.maxAdvantage > 0) {
    lines.push({ label: 'Avantage', value: `+${round.maxAdvantage} au mieux` });
  }
  const ceremony = round.ceremony ? CEREMONY_LABELS[round.ceremony] : undefined;
  if (ceremony) {
    lines.push({ label: 'Bonus', value: ceremony });
  }
  return {
    title: `Round ${round.roundNumber} ${round.won ? 'gagné' : 'perdu'}`,
    text: `${SIDE_LABELS[round.side]}, ${BUY_SENTENCE_LABELS[round.buy]} contre ${BUY_SENTENCE_LABELS[round.oppBuy]}`,
    lines,
    note: 'Clic : ouvrir le détail du round',
  };
}

/** '31 min' from milliseconds; a dash when unknown. */
export function matchLength(ms: number | null): string {
  return ms ? `${Math.round(ms / 60000)} min` : '—';
}

/** '22h21' from an ISO date-time, read in the time zone it was written in. */
export function startTime(iso: string): string {
  return iso.slice(11, 16).replace(':', 'h');
}
