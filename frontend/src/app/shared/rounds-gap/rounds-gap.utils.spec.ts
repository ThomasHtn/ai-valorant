import { matchesText, roundsGapText } from './rounds-gap.utils';

describe('roundsGapText', () => {
  it('writes the direction in words, rounded to whole rounds', () => {
    expect(roundsGapText(-11)).toEqual({ count: '11', words: 'rounds perdus' });
    expect(roundsGapText(4.6)).toEqual({ count: '5', words: 'rounds gagnés' });
    expect(roundsGapText(-1.2)).toEqual({ count: '1', words: 'round perdu' });
    expect(roundsGapText(0.3)).toEqual({ count: '< 1', words: 'round gagné' });
  });

  it('counts the matches', () => {
    expect(matchesText(1)).toBe('sur 1 match');
    expect(matchesText(27)).toBe('sur 27 matchs');
  });
});
