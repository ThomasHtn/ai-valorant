import { donutArcs } from './donut.utils';

describe('donutArcs', () => {
  it('lays slices end to end, each shortened by the gap', () => {
    const [a, b] = donutArcs([
      { key: 'a', value: 1, color: 'red' },
      { key: 'b', value: 1, color: 'blue' },
    ]);
    const half = Math.PI * 54;
    expect(Number(a.dash.split(' ')[0])).toBeCloseTo(half - 2, 0);
    expect(a.offset === 0).toBe(true);
    expect(b.offset).toBeCloseTo(-half, 0);
  });
});
