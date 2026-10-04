import { describe, expect, it } from 'vitest';

import { ReportPeriods } from '@core/report/report-periods.model';

import { focusMonth, ofMonth, periodTitle, sessionDay, winShare } from './period-switcher.utils';

const periods: ReportPeriods = {
  freshness: '',
  firstDay: '2026-05-04',
  lastDay: '2026-10-01',
  topMatches: 0,
  patches: ['13.06'],
  months: [
    { key: '2026-10', matches: 3, wins: 3, losses: 0, sessions: [] },
    { key: '2026-09', matches: 27, wins: 12, losses: 15, sessions: [] },
  ],
};

describe('period switcher utils', () => {
  it('titles each kind of period', () => {
    expect(periodTitle({}, periods)).toBe('Octobre 2026');
    expect(periodTitle({ month: '2026-09' }, periods)).toBe('Septembre 2026');
    expect(periodTitle({ patch: '13.06' }, periods)).toBe('Patch 13.06');
    expect(periodTitle({ start: '2026-10-01', end: '2026-10-01' }, periods)).toBe(
      'Session du jeudi 1 octobre',
    );
    expect(periodTitle({ start: '2026-05-04', end: '2026-10-01' }, periods)).toBe(
      "Tout l'historique",
    );
  });

  it('opens on the month being read', () => {
    expect(focusMonth({ start: '2026-09-30', end: '2026-09-30' }, periods)).toBe('2026-09');
    expect(focusMonth({ patch: '13.06' }, periods)).toBe('2026-10');
  });

  it('elides before a vowel', () => {
    expect(ofMonth('2026-10')).toBe("d'octobre 2026");
    expect(ofMonth('2026-09')).toBe('de septembre 2026');
  });

  it('capitalises a session day', () => {
    expect(sessionDay('2026-09-30')).toBe('Mer. 30 sept.');
  });

  it('shares wins without dividing by zero', () => {
    expect(winShare(3, 1)).toBe(0.75);
    expect(winShare(0, 0)).toBe(0);
  });
});
