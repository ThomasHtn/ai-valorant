/** Drawing box of the profile radar in CSS pixels; labels need the room left and right of the web. */
export const RADAR_BOX = { width: 500, height: 380, radius: 128, labelGap: 18 };

/**
 * Player / reference ratio at the centre and at the rim. The reference sits on the ring halfway, so
 * a stat 40 % better or worse than the reference reaches the rim or the centre.
 */
export const RADAR_RATIO = { min: 0.6, max: 1.4 };

/** Rings drawn behind the web, as ratios to the reference: 1 is the reference, the last the rim. */
export const RADAR_RINGS: readonly number[] = [0.8, 1, 1.2, 1.4];

/** Short axis names; a stat missing here keeps the API's label. */
export const RADAR_AXIS_LABELS: Readonly<Record<string, string>> = {
  acs: 'ACS',
  kd: 'K/D',
  adr: 'ADR',
  kast: 'KAST',
  assists: 'Assists',
  utility: 'Utilitaires',
  given: 'Revenges données',
  zeroDmg: 'Morts à 0 dégât',
  fb: 'First bloods',
  fd: 'First deaths',
  duelsWon: 'Premiers duels',
  revenge: 'Morts avec revenge',
  isolated: 'Morts isolées',
  clutch: 'Clutchs',
  hs: 'HS',
};

/** Colour of a lone player's points and values per tone; uncoloured ones stay white. */
export const RADAR_TONE_COLOURS = {
  good: 'var(--color-rating-good)',
  avg: 'var(--color-rating-average)',
  bad: 'var(--color-rating-bad)',
  small: 'var(--color-text-muted)',
  none: 'var(--color-text-primary)',
} as const;

/** Polygon colour of a lone player. */
export const RADAR_SQUAD_COLOUR = 'var(--color-squad)';
