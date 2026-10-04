import { SIDE_LABELS } from '@core/format/labels.constants';
import { RoundStripCell } from '@core/report/matches.model';

import { HalfScore } from './match-header.model';

const HALF_LENGTH = 12;
const OVERTIME_START = 24;

/** Score of each half in the order played, then the overtime when there was one. */
export function halfScores(rounds: readonly RoundStripCell[]): HalfScore[] {
  const parts = [
    { key: 'first', rounds: rounds.slice(0, HALF_LENGTH) },
    { key: 'second', rounds: rounds.slice(HALF_LENGTH, OVERTIME_START) },
    { key: 'overtime', rounds: rounds.slice(OVERTIME_START) },
  ];
  return parts
    .filter((part) => part.rounds.length)
    .map((part) => {
      const won = part.rounds.filter((r) => r.won).length;
      const side = part.key === 'overtime' ? null : part.rounds[0].side;
      return {
        key: part.key,
        label: side ? SIDE_LABELS[side] : 'Prolongation',
        side,
        won,
        lost: part.rounds.length - won,
      };
    });
}
