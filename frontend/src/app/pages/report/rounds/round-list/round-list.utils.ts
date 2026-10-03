import { LOSS_CAUSE_LABELS } from '@core/format/labels.constants';
import { RoundLine } from '@core/report/rounds.model';

/** Right-hand side of a list row: how the round ended, and the chance the squad had when thrown. */
export interface RoundOutcome {
  outcome: string;
  won: boolean;
  /** 'avait 78 %' on a lost round the squad had in hand, else null. */
  chance: string | null;
}

/** 'Clutch perdu' (the cause of a lost round) or 'Gagné', plus the chance of a throw. */
export function roundOutcome(round: RoundLine): RoundOutcome {
  const chance =
    round.thrown && round.bestProbability !== null
      ? `avait ${Math.round(round.bestProbability * 100)} %`
      : null;
  return {
    outcome: round.won ? 'Gagné' : round.cause ? LOSS_CAUSE_LABELS[round.cause] : 'Perdu',
    won: round.won,
    chance,
  };
}
