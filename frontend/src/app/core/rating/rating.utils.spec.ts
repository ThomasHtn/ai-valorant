import { rateAgainst, rateStat, rateTone, rateValue } from './rating.utils';

describe('rating', () => {
  it('rates a value against fixed benchmarks', () => {
    expect(rateStat('acs', 250)).toBe('good');
    expect(rateStat('acs', 200)).toBe('average');
    expect(rateStat('acs', 150)).toBe('bad');
    expect(rateStat('acs', null)).toBe('unknown');
  });

  it('flips the benchmarks when lower is better', () => {
    const deaths = { bad: 0.8, good: 0.6, higherIsBetter: false };
    expect(rateValue(0.5, deaths)).toBe('good');
    expect(rateValue(0.7, deaths)).toBe('average');
    expect(rateValue(0.9, deaths)).toBe('bad');
  });

  it('reads a rate close to its reference as average', () => {
    expect(rateAgainst(0.52, 0.5)).toBe('average');
    expect(rateAgainst(0.6, 0.5)).toBe('good');
    expect(rateAgainst(0.4, 0.5)).toBe('bad');
    expect(rateAgainst(0.4, 0.5, { higherIsBetter: false })).toBe('good');
  });

  it('scales the band on the reference for means', () => {
    expect(rateAgainst(205, 200, { relative: true })).toBe('average');
    expect(rateAgainst(220, 200, { relative: true })).toBe('good');
  });

  it('turns a statistical verdict into a rating', () => {
    expect(rateTone('good')).toBe('good');
    expect(rateTone('neutral')).toBe('average');
    expect(rateTone(null)).toBe('unknown');
  });
});
