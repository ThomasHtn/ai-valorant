import { describe, expect, it } from 'vitest';

import { RoundLine } from '@core/report/rounds.model';

import { roundFigure } from './round-list.utils';

const round = {
  bestState: '4v3',
  bestProbability: 0.72,
  maxDrop: 0.4,
} as RoundLine;

describe('round list figure', () => {
  it('shows the best situation with its chance in the title', () => {
    expect(roundFigure(round, false)).toEqual({
      figurePrefix: 'max',
      figure: '4v3',
      figureTitle: 'Meilleure situation du round (72 % de chances)',
    });
  });

  it('shows the biggest fall when sorted by it', () => {
    expect(roundFigure(round, true).figure).toBe('−40 pts');
  });
});
