import { RoundEvent } from '@core/report/rounds.model';

/** Team size: one dot per player in the alive counter. */
const TEAM_SIZE = 5;

/** Kind of a timeline line, seen from the squad: its label and the classes of its tag. */
export interface EventTag {
  label: string;
  className: string;
}

/** 'Kill' for a squad kill, 'Mort' for a squad death, 'Plant' and 'Defuse' otherwise. */
export function eventTag(event: RoundEvent): EventTag {
  if (event.kind === 'kill') {
    return event.squadActor
      ? { label: 'Kill', className: 'tone-good' }
      : { label: 'Mort', className: 'tone-bad' };
  }
  return { label: event.kind === 'plant' ? 'Plant' : 'Defuse', className: 'bg-text-primary/10' };
}

/** Five dots, the first `alive` ones lit. */
export function aliveDots(alive: number): boolean[] {
  return Array.from({ length: TEAM_SIZE }, (_, i) => i < alive);
}
