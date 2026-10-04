import { historyLabel } from './history-label.utils';

describe('historyLabel', () => {
  it('names the period the history ends at', () => {
    expect(historyLabel({ month: '2026-09' }, null)).toBe('Avant septembre');
    expect(historyLabel({ patch: '13.05' }, '2026-10')).toBe('Avant le patch 13.05');
    expect(historyLabel({ start: '2026-09-30', end: '2026-09-30' }, null)).toBe(
      'Avant le 30 septembre',
    );
  });

  it('falls back to the latest month, then to a generic label', () => {
    expect(historyLabel({}, '2026-10')).toBe('Avant octobre');
    expect(historyLabel({}, null)).toBe('Avant la période');
  });
});
