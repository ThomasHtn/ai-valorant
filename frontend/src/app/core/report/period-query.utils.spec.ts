import {
  periodOption,
  periodQueryFromOption,
  periodQueryFromParams,
  periodQueryParams,
  samePeriodQuery,
} from './period-query.utils';

describe('period query utils', () => {
  it('reads only the period keys of the URL', () => {
    expect(periodQueryFromParams({ month: '2026-09', ref: 'top' })).toEqual({ month: '2026-09' });
    expect(periodQueryParams({ start: '2026-10-01', end: '2026-10-01' })).toEqual({
      start: '2026-10-01',
      end: '2026-10-01',
    });
  });

  it('round-trips every kind of period through the selector option', () => {
    const queries = [
      { month: '2026-09' },
      { patch: '13.06' },
      { start: '2026-10-01', end: '2026-10-01' },
      { start: '2026-05-04', end: '2026-10-01' },
    ];
    for (const query of queries) {
      expect(periodQueryFromOption(periodOption(query))).toEqual(query);
    }
    expect(periodOption({ start: '2026-10-01', end: '2026-10-01' })).toBe('session:2026-10-01');
    expect(periodQueryFromOption('')).toEqual({});
  });

  it('compares two periods key by key', () => {
    expect(samePeriodQuery({ month: '2026-09' }, { month: '2026-09' })).toBe(true);
    expect(samePeriodQuery({ month: '2026-09' }, { patch: '13.06' })).toBe(false);
  });
});
