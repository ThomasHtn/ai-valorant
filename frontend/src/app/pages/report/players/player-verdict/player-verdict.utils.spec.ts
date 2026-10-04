import { describe, expect, it } from 'vitest';

import { PlayerFigure } from '../players-figure.model';
import { gapSentence, playerVerdict } from './player-verdict.utils';

function figure(
  key: string,
  v: number,
  opp: number,
  format: 'pct' | 'int',
  better = 1,
): PlayerFigure {
  return {
    key,
    label: key,
    help: null,
    format,
    better,
    min: 20,
    unit: 'rounds',
    cell: { v, n: 445, opp },
  };
}

describe('player verdict', () => {
  it('writes the gap in points for rates and in percent for means', () => {
    expect(gapSentence(0.58, 0.68, true, 'eux')).toBe('10 points de moins que eux');
    expect(gapSentence(110, 164, false, 'eux')).toBe('33 % de moins que eux');
    expect(gapSentence(0.5, 0.5, true, 'eux')).toBe('autant que eux');
  });

  it('lists strengths and weaknesses, biggest gap first, and counts them', () => {
    const verdict = playerVerdict(
      [
        figure('acs', 110, 164, 'int'),
        figure('kast', 0.58, 0.68, 'pct'),
        figure('zeroDmg', 0.3, 0.4, 'pct', -1),
        figure('hs', 0.25, 0.26, 'pct'),
      ],
      'opp',
      'les initiateurs adverses',
    );
    expect(verdict.weaknesses.map((i) => i.key)).toEqual(['acs', 'kast']);
    expect(verdict.strengths.map((i) => i.key)).toEqual(['zeroDmg']);
    expect(verdict.counts).toEqual({ good: 1, avg: 1, bad: 2 });
    expect(verdict.weaknesses[1].sentence).toMatch(
      /^10 points de moins que les initiateurs adverses \(68\s%\), sur 445 rounds\.$/u,
    );
  });
});
