import { HabitReading } from '../squad.model';

/** Grid columns of a situation table: the opener, the label, the figures, the map. */
export const SITUATION_COLUMNS =
  '1.75rem minmax(12rem,2fr) 4rem 4.25rem 5.25rem 5.75rem 4.75rem 7.5rem minmax(9.5rem,1.3fr)';

/** Under this width the table scrolls sideways instead of wrapping its labels. */
export const SITUATION_MIN_WIDTH = 960;

/** Grid columns of the players of an expanded line. */
export const PLAYER_COLUMNS = 'minmax(10rem,1fr) 4rem 4.5rem 4rem 6.5rem';

/** What an expanded line says under its maps. */
export const READING_SENTENCES: Record<HabitReading['kind'], string> = {
  habit: "Une habitude de l'escouade : à travailler partout, pas sur une carte.",
  map: 'Le problème tient surtout à cette carte.',
  none: 'Aucune carte ne se détache.',
};
