import { describe, expect, it } from 'vitest';

import { exploreLabel, reportLocation, viewForPeriod } from './report-tabs.utils';

describe('report tabs utils', () => {
  it('reads the view and sub-page of a report URL', () => {
    expect(reportLocation('/report/tables/economy?month=2026-09')).toEqual({
      view: 'tables',
      sub: 'economy',
    });
    expect(reportLocation('/report/summary')).toEqual({ view: 'summary', sub: null });
    expect(reportLocation('/elsewhere')).toEqual({ view: null, sub: null });
  });

  it('sends a view a period does not offer to its first view', () => {
    expect(viewForPeriod('minimap', true)).toBe('debrief');
    expect(viewForPeriod('matches', true)).toBeNull();
    expect(viewForPeriod('debrief', false)).toBe('summary');
    expect(viewForPeriod('findings', false)).toBeNull();
  });

  it('names the Explorer entry being read', () => {
    expect(exploreLabel({ view: 'tables', sub: 'economy' })).toBe('Économie');
    expect(exploreLabel({ view: 'tables', sub: null })).toBe('Résultats');
    expect(exploreLabel({ view: 'tables', sub: 'detections' })).toBe('Alertes');
    expect(exploreLabel({ view: 'trend', sub: null })).toBe('Évolution');
    expect(exploreLabel({ view: 'matches', sub: 'abc' })).toBeNull();
  });
});
