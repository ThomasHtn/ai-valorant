import { ReportPeriods } from '@core/report/report-periods.model';

import { periodOptionGroups } from './period-selector.utils';

const periods: ReportPeriods = {
  freshness: '02/10 à 10:53',
  firstDay: '2026-05-04',
  lastDay: '2026-10-01',
  topMatches: 1741,
  patches: ['13.06'],
  months: [
    {
      key: '2026-10',
      matches: 3,
      wins: 3,
      losses: 0,
      sessions: [{ day: '2026-10-01', matches: 3, wins: 3, losses: 0, maps: [], scores: [] }],
    },
  ],
};

describe('period selector utils', () => {
  it('lists months, evenings, patches and the whole history', () => {
    const groups = periodOptionGroups(periods);
    expect(groups.map((g) => g.label)).toEqual(['Mois', 'Sessions', 'Patchs', 'Historique']);
    expect(groups[0].options[0]).toEqual({ value: 'month:2026-10', label: 'Octobre 2026' });
    expect(groups[1].options[0].value).toBe('session:2026-10-01');
    expect(groups[3].options[0].value).toBe('range:2026-05-04:2026-10-01');
  });
});
