/**
 * Fixed scale of each figure, from a weak to a strong ranked value: the radar and the stat bars place
 * the player and his reference on it, so both keep their real distance. Lower-is-better figures are
 * flipped by their `better` sign, not here.
 */
export const STAT_SCALES: Readonly<Record<string, { min: number; max: number }>> = {
  acs: { min: 100, max: 300 },
  kd: { min: 0.4, max: 1.6 },
  adr: { min: 60, max: 190 },
  kast: { min: 0.5, max: 0.85 },
  fb: { min: 0.05, max: 0.25 },
  fd: { min: 0.05, max: 0.25 },
  fbfd: { min: -0.1, max: 0.1 },
  duelsWon: { min: 0.25, max: 0.75 },
  revenge: { min: 0.05, max: 0.35 },
  hs: { min: 0.1, max: 0.4 },
  assists: { min: 0.1, max: 0.6 },
  utility: { min: 0.5, max: 3.5 },
  given: { min: 0.03, max: 0.2 },
  zeroDmg: { min: 0.2, max: 0.6 },
  isolated: { min: 0.25, max: 0.65 },
  clutch: { min: 0, max: 0.4 },
};

/** Scale of a rate without its own entry (rounds won after a first blood, clutches). */
export const RATE_SCALE = { min: 0, max: 1 };

/** Smallest reach drawn, so a figure at the bottom of its scale still shows a point off the centre. */
export const MIN_REACH = 0.04;
