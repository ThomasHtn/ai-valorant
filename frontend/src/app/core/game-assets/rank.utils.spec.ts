import { parseRank, rankIcon } from './rank.utils';

describe('rank utils', () => {
  it('reads English and French rank names', () => {
    expect(parseRank('Platinum 1')).toEqual({ slug: 'platinum-1', label: 'Platine 1' });
    expect(parseRank('Argent 3')).toEqual({ slug: 'silver-3', label: 'Argent 3' });
    expect(parseRank('Radiant')).toEqual({ slug: 'radiant', label: 'Radiant' });
  });

  it('ignores anything that is not a rank', () => {
    expect(parseRank('Unranked')).toBeNull();
    expect(parseRank('')).toBeNull();
    expect(parseRank(null)).toBeNull();
  });

  it('points at the icon file', () => {
    expect(rankIcon({ slug: 'gold-2', label: 'Or 2' })).toBe('assets/valorant/ranks/gold-2.webp');
  });
});
