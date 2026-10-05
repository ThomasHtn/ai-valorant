import { dumbbellX, sideTotals } from './map-board.utils';

const plain = (text: string) => text.replace(/\s/g, ' ');
const gap = (k: number, n: number, top: number) => ({ k, n, top, topN: 100, rounds: k - n * top });

describe('dumbbellX', () => {
  it('maps 30 % to 75 % across the axis and clamps outside', () => {
    expect(dumbbellX(0.3)).toBe(10);
    expect(dumbbellX(0.75)).toBe(210);
    expect(dumbbellX(0.9)).toBe(210);
    expect(dumbbellX(null)).toBe(10);
  });
});

describe('sideTotals', () => {
  it('weights the top ranked rate by the squad rounds on each map', () => {
    const maps = [
      { mapName: 'A', matches: 1, wins: 1, attack: gap(5, 10, 0.4), defense: gap(5, 10, 0.5) },
      { mapName: 'B', matches: 1, wins: 0, attack: gap(10, 30, 0.6), defense: gap(5, 10, 0.5) },
    ];
    const { attack } = sideTotals(maps);
    expect(plain(attack.volume)).toBe('15 sur 40');
    expect(plain(attack.top)).toBe('55 %');
    expect(attack.rounds.text).toBe('−7');
  });
});
