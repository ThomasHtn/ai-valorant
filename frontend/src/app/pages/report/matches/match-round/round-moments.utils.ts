import { RoundEvent, RoundLine } from '@core/report/rounds.model';

import { KeyMoment } from './round-moments.model';
import { START_PROBABILITY } from './win-probability-chart/win-probability-chart.constants';

/** Probability gap under which an event's chance is taken as the round's best chance. */
const SAME_CHANCE = 0.01;

/** The squad's chance right before each event: 50 % for the first, then the previous event's. */
export function chancesBefore(events: readonly RoundEvent[]): number[] {
  return events.map((_, index) => (index ? events[index - 1].winProbability : START_PROBABILITY));
}

/**
 * Biggest fall of the squad's chance in a lost round, biggest rise in a won one. Events that end the
 * round (a team wiped out, a defuse) are left out: they always swing to 0 or 100 % and teach nothing.
 */
export function keyMoment(events: readonly RoundEvent[], won: boolean): KeyMoment | null {
  const before = chancesBefore(events);
  let key: KeyMoment | null = null;
  for (const [index, event] of events.entries()) {
    const swing = (won ? 1 : -1) * (event.winProbability - before[index]);
    const best = key ? Math.abs(key.to - key.from) : 0;
    if (!endsRound(event) && swing > best) {
      key = { index, from: before[index], to: event.winProbability };
    }
  }
  return key;
}

/** Event where the squad reached the round's best chance, null when it was the start of the round. */
export function bestMomentStep(round: RoundLine, events: readonly RoundEvent[]): number | null {
  const best = round.bestProbability;
  if (best === null) {
    return null;
  }
  const index = events.findIndex(
    (e) =>
      `${e.ownAlive}v${e.oppAlive}` === round.bestState &&
      Math.abs(e.winProbability - best) < SAME_CHANCE,
  );
  return index >= 0 ? index : null;
}

function endsRound(event: RoundEvent): boolean {
  return event.kind === 'defuse' || event.ownAlive === 0 || event.oppAlive === 0;
}
