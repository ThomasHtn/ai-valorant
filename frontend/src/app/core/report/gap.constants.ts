/** Rules of the gap boards (Escouade, Sessions, Joueurs): when a gap is coloured, kept, or greyed. */

/** Under this sample a line is greyed and sent to the end of its board. */
export const GAP_MIN_SAMPLE = 5;

/** Per-map cells: a loss of this many rounds or more gets the strong red. */
export const STRONG_MAP_GAP = 2;

/** Lines of the priority board shown before "Afficher les autres". */
export const PRIORITIES_SHOWN = 5;

/** Map verdicts: rounds over (or under) the top ranked, and matches before any verdict. */
export const VERDICT_SOLID_ROUNDS = 2;
export const VERDICT_WORK_ROUNDS = -5;
export const VERDICT_MIN_MATCHES = 3;
