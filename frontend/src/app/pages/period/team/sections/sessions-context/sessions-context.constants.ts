/** Below this many matches a bar is greyed: too few to read anything into. */
export const CONTEXT_MIN_MATCHES = 3;

/** The three breakdowns drawn as charts, in display order. */
export const CONTEXT_GROUPS = [
  { key: 'byRankInEvening', title: 'Rang du match dans la soirée' },
  { key: 'byStartHour', title: 'Heure de début' },
  { key: 'byWeekday', title: 'Jour de la semaine' },
] as const;
