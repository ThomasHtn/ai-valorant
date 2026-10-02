import { monthGroups } from './home.utils';

describe('monthGroups', () => {
  const session = (day: string, wins: number, losses: number) => ({
    day,
    matches: wins + losses,
    wins,
    losses,
    maps: [],
  });

  it('nests each evening under its month, newest month first, with the month record', () => {
    const groups = monthGroups(
      ['2026-09', '2026-10'],
      [session('2026-10-01', 3, 0), session('2026-09-30', 1, 2), session('2026-09-28', 1, 2)],
    );
    expect(groups.map((g) => g.month)).toEqual(['2026-10', '2026-09']);
    expect(groups[1].sessions.map((s) => s.day)).toEqual(['2026-09-30', '2026-09-28']);
    expect([groups[1].wins, groups[1].losses]).toEqual([2, 4]);
  });

  it('keeps a month that has a report but no evening', () => {
    expect(monthGroups(['2026-08'], [])[0].sessions).toEqual([]);
  });
});
