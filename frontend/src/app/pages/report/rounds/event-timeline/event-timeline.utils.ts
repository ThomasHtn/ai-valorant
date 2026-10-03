import { RoundEvent } from '@core/report/rounds.model';

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

/** Chance before and after an event ('48 → 22 %') with the tone of its move. */
export interface ChanceShift {
  label: string;
  className: string;
}

/** The squad's chance before and after an event; green when it rose, red when it fell. */
export function chanceShift(from: number, to: number): ChanceShift {
  const before = Math.round(from * 100);
  const after = Math.round(to * 100);
  return {
    label: `${before} → ${after} %`,
    className:
      after > before ? 'text-rating-good' : after < before ? 'text-rating-bad' : 'text-text-muted',
  };
}
