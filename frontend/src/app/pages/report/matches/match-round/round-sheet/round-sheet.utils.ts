import { clock } from '@core/format/format.utils';
import { LOSS_CAUSE_LABELS } from '@core/format/labels.constants';
import { LOSS_CAUSE_REASONS, RESULT_LABELS } from '@core/format/round-labels.constants';
import { RoundEvent, RoundLine } from '@core/report/rounds.model';

import { KeyMoment } from '../round-moments.model';
import { bestMomentStep } from '../round-moments.utils';
import { RoundSummary, SummaryMoment } from './round-sheet.model';

/** Opening state of every round, named "début du round" when it was the best moment. */
const START_STATE = '5v5';

/** How the round ended, why it was lost, its best moment and its key moment. */
export function roundSummary(
  round: RoundLine,
  events: readonly RoundEvent[],
  key: KeyMoment | null,
): RoundSummary {
  return {
    won: round.won,
    outcome: `${round.won ? 'Gagné' : 'Perdu'} (${(RESULT_LABELS[round.result] ?? round.result).toLowerCase()})`,
    cause: round.cause
      ? { label: LOSS_CAUSE_LABELS[round.cause], reason: LOSS_CAUSE_REASONS[round.cause] }
      : null,
    best: bestMoment(round, events),
    key: key ? keyLine(events[key.index], key) : null,
  };
}

/** '78 % de chances en 4v3 à 0:41', or 'au début du round' when nothing went better than 5v5. */
function bestMoment(round: RoundLine, events: readonly RoundEvent[]): SummaryMoment | null {
  if (round.bestProbability === null || !round.bestState) {
    return null;
  }
  const step = bestMomentStep(round, events);
  const when =
    step !== null
      ? ` à ${clock(events[step].ms)}`
      : round.bestState === START_STATE
        ? ', au début du round'
        : '';
  const chance = Math.round(round.bestProbability * 100);
  return { text: `${chance} % de chances en ${round.bestState}${when}`, step };
}

/** '0:29, Little Giant tue Psilonnix à B Garage (Phantom) : 48 → 22 %'. */
function keyLine(event: RoundEvent, key: KeyMoment): SummaryMoment {
  const from = Math.round(key.from * 100);
  const to = Math.round(key.to * 100);
  return { text: `${clock(event.ms)}, ${event.text} : ${from} → ${to} %`, step: key.index };
}
