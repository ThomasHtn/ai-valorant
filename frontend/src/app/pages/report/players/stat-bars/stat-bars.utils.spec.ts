import { referenceLine } from './stat-bars.utils';

describe('referenceLine', () => {
  it('writes the reference then the sample on one line', () => {
    expect(referenceLine({ reference: 'Sentinelles adverses 200', sample: 'sur 576 rounds' })).toBe(
      'Sentinelles adverses 200, sur 576 rounds',
    );
    expect(referenceLine({ reference: null, sample: null })).toBe('Pas de référence');
  });
});
