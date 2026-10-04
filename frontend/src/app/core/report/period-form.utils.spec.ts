import { describe, expect, it } from 'vitest';

import { ReportPeriods } from './report-periods.model';
import { periodForm, sessionForm } from './period-form.utils';

const periods: ReportPeriods = {
  freshness: '',
  firstDay: '2026-09-28',
  lastDay: '2026-10-01',
  topMatches: 0,
  patches: ['13.06'],
  months: [
    {
      key: '2026-10',
      matches: 2,
      wins: 1,
      losses: 1,
      sessions: [
        {
          day: '2026-10-01',
          matches: 2,
          wins: 1,
          losses: 1,
          maps: ['Split', 'Ascent'],
          scores: ['13-7', '9-13'],
        },
      ],
    },
    {
      key: '2026-09',
      matches: 1,
      wins: 0,
      losses: 1,
      sessions: [
        { day: '2026-09-28', matches: 1, wins: 0, losses: 1, maps: ['Lotus'], scores: ['11-13'] },
      ],
    },
  ],
};

describe('period form', () => {
  it('reads each match margin from its score', () => {
    expect(sessionForm(periods.months[0].sessions[0]).map((m) => m.margin)).toEqual([6, -4]);
  });

  it('defaults to the latest month', () => {
    expect(periodForm(periods, {})?.map((m) => m.map)).toEqual(['Split', 'Ascent']);
  });

  it('keeps play order across months for a range', () => {
    const form = periodForm(periods, { start: '2026-09-01', end: '2026-10-01' });
    expect(form?.map((m) => m.map)).toEqual(['Lotus', 'Split', 'Ascent']);
  });

  it('cannot tell a patch apart', () => {
    expect(periodForm(periods, { patch: '13.06' })).toBeNull();
  });
});
