/** Drawing box of the profile radar in CSS pixels; labels need the room around the web. */
export const RADAR_BOX = { width: 660, height: 480, radius: 175, labelGap: 20 };

/** Rings drawn behind the web, as reach on each axis' scale (the rim is the strong end). */
export const RADAR_RINGS: readonly number[] = [0.25, 0.5, 0.75, 1];

/** Short axis names; a figure missing here keeps the API's label. */
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
  fbfd: 'FB moins FD',
  duelsWon: 'Premiers duels',
  revenge: 'Morts avec revenge',
  isolated: 'Morts isolées',
  clutch: 'Clutchs',
  hs: 'HS',
};

/** Colour of a lone player's points per tone; uncoloured ones stay white. */
export const RADAR_TONE_COLOURS = {
  good: 'var(--color-rating-good)',
  avg: 'var(--color-rating-average)',
  bad: 'var(--color-rating-bad)',
  small: 'var(--color-text-muted)',
  none: 'var(--color-text-primary)',
} as const;

/** Polygon colour of a lone player, and of his reference. */
export const RADAR_SQUAD_COLOUR = 'var(--color-squad)';
export const RADAR_REFERENCE_COLOUR = 'var(--color-top)';

/** Help of the radar's "i": how the fixed scales read. */
export const RADAR_HELP = {
  title: 'Profil',
  what: 'Les chiffres clés du joueur sur une seule toile, avec en pointillé ceux de la référence.',
  how: "Chaque branche a sa propre échelle, d'un niveau faible en ranked au centre à un très bon niveau au bord (ACS de 100 à 300, KAST de 50 à 85 %...). Pour un chiffre où plus bas = mieux, l'échelle est inversée.",
  read: 'Plus loin du centre = mieux. Là où la forme du joueur rentre sous le pointillé, la référence fait mieux que lui.',
};
