import { integer } from '@core/format/value-format.utils';

/** A gap in rounds written in words: '11' + 'rounds perdus', or '< 1' + 'round gagné'. */
export interface RoundsGapText {
  count: string;
  words: string;
}

/**
 * Rounds won (+) or lost (-) against the reference, as a count and the words that say which way, so
 * no sign has to be decoded: '−11,0' becomes '11 rounds perdus'.
 */
export function roundsGapText(gap: number): RoundsGapText {
  const size = Math.round(Math.abs(gap));
  const verb = gap < 0 ? 'perdu' : 'gagné';
  if (size < 1) {
    return { count: '< 1', words: `round ${verb}` };
  }
  const plural = size > 1 ? 's' : '';
  return { count: integer(size), words: `round${plural} ${verb}${plural}` };
}

/** 'sur 5 matchs' under the gap. */
export function matchesText(matches: number): string {
  return `sur ${integer(matches)} match${matches > 1 ? 's' : ''}`;
}
