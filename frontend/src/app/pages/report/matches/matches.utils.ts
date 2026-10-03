import { LossCause } from '@core/common/enums.model';
import { LOSS_CAUSE_LABELS, SIDE_LABELS } from '@core/format/labels.constants';
import {
  BUY_SENTENCE_LABELS,
  CEREMONY_LABELS,
  RESULT_LABELS,
} from '@core/format/round-labels.constants';
import { MatchList, RoundStripCell } from '@core/report/matches.model';
import { HoverTipContent } from '@shared/hover-tip/hover-tip.model';

/** Rounds of regulation; overtime then swaps sides every round. */
const HALF_LENGTH = 12;
const OVERTIME_START = 24;

/** A round of the strip, or the gap drawn where the teams swap sides. */
export type StripItem = { kind: 'round'; cell: RoundStripCell } | { kind: 'swap'; key: string };

/** The match opened by default: the latest one of the newest evening. */
export function defaultMatchId(list: MatchList | null | undefined): string | null {
  const evening = list?.evenings[0];
  return evening?.matches.at(-1)?.matchId ?? null;
}

/** Rounds with a gap at half time and at each side swap of the overtime. */
export function stripItems(rounds: readonly RoundStripCell[]): StripItem[] {
  const items: StripItem[] = [];
  rounds.forEach((cell, index) => {
    if (index === HALF_LENGTH || (index >= OVERTIME_START && index % 2 === 0)) {
      items.push({ kind: 'swap', key: `swap-${index}` });
    }
    items.push({ kind: 'round', cell });
  });
  return items;
}

/** One bar of the "lost rounds by cause" list; `share` is relative to the most frequent cause. */
export interface CauseCount {
  cause: LossCause | null;
  label: string;
  count: number;
  share: number;
}

/** Lost rounds grouped by cause, most frequent first. */
export function lossCauseCounts(rounds: readonly RoundStripCell[]): CauseCount[] {
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

/** Tip of a round of the strip: side and buys, how it ended, its cause, best lead, ceremony. */
export function roundTip(round: RoundStripCell): HoverTipContent {
  const lines = [
    {
      label: 'Fin',
      value: `${RESULT_LABELS[round.result] ?? round.result}${round.planted && round.plantSite ? ` · plant en ${round.plantSite}` : ''}`,
    },
  ];
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
    title: `Round ${round.roundNumber} · ${round.won ? 'gagné' : 'perdu'}`,
    text: `${SIDE_LABELS[round.side]} · ${BUY_SENTENCE_LABELS[round.buy]} contre ${BUY_SENTENCE_LABELS[round.oppBuy]}`,
    lines,
    note: 'Clic : fiche du round',
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
