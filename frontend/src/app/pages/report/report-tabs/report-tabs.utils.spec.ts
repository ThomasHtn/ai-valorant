import { describe, expect, it } from 'vitest';

import { exploreLabel, redirectFor, reportLocation } from './report-tabs.utils';

describe('report tabs utils', () => {
  it('reads the view and sub-page of a report URL', () => {
    expect(reportLocation('/report/tables/economy?month=2026-09')).toEqual({
      view: 'tables',
      sub: 'economy',
    });
    expect(reportLocation('/report/summary')).toEqual({ view: 'summary', sub: null });
    expect(reportLocation('/elsewhere')).toEqual({ view: null, sub: null });
  });

  it('opens a session under Sessions, inside its month', () => {
    expect(
      redirectFor({ view: 'squad', sub: null }, { start: '2026-09-27', end: '2026-09-27' }),
    ).toEqual({
      commands: ['/report/sessions', '2026-09-27'],
      queryParams: { month: '2026-09' },
    });
  });

  it('leaves other periods and round pages where they are', () => {
    expect(redirectFor({ view: 'squad', sub: null }, { month: '2026-09' })).toBeNull();
    expect(
      redirectFor({ view: 'matches', sub: 'abc' }, { start: '2026-09-27', end: '2026-09-27' }),
    ).toBeNull();
  });

  it('names the Explorer entry being read', () => {
    expect(exploreLabel({ view: 'tables', sub: 'economy' })).toBe('Économie');
    expect(exploreLabel({ view: 'tables', sub: null })).toBe('Résultats');
    expect(exploreLabel({ view: 'tables', sub: 'detections' })).toBe('Alertes');
    expect(exploreLabel({ view: 'trend', sub: null })).toBe('Évolution');
    expect(exploreLabel({ view: 'matches', sub: 'abc' })).toBeNull();
  });
});
