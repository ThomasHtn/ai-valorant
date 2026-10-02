import { ContextRow } from '@core/periods/insights.model';

import { contextBars } from './sessions-context.utils';

function row(label: string, matches: number, won: number, total: number): ContextRow {
  return {
    label,
    record: {
      matches,
      wins: 0,
      losses: matches,
      rounds: { count: won, total, value: total ? won / total : null },
    },
  };
}

describe('contextBars', () => {
  it('highlights the best judged bar and greys the small samples', () => {
    const bars = contextBars([
      row('20h', 5, 50, 100),
      row('21h', 4, 60, 100),
      row('23h', 1, 90, 100),
    ]);
    expect(bars.map((b) => b.value)).toEqual([50, 60, 90]);
    expect(bars.map((b) => b.highlighted)).toEqual([false, true, false]);
    expect(bars.map((b) => b.muted)).toEqual([false, false, true]);
  });
});
