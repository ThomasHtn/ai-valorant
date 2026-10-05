import { HabitReading } from '../squad.model';

/** Colour of the reading: red for a habit, amber for one map, grey when nothing stands out. */
export const HABIT_READING_CLASSES: Record<HabitReading['kind'], string> = {
  habit: 'text-rating-bad-soft',
  map: 'text-brand-400',
  none: 'text-text-muted',
};
