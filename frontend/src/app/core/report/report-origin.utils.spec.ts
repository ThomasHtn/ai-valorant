import { describe, expect, it } from 'vitest';

import { isRoundsUrl, reportOrigin } from './report-origin.utils';

describe('report origin', () => {
  it('names a match by its role', () => {
    expect(reportOrigin('/report/matches/abc?month=2026-09')).toEqual({
      url: '/report/matches/abc?month=2026-09',
      label: 'Retour au match',
    });
  });

  it('names any other view by its tab', () => {
    expect(reportOrigin('/report/minimap/Split?month=2026-09')?.label).toBe('Retour à Minimap');
    expect(reportOrigin('/report/findings')?.label).toBe('Retour à Points forts et faibles');
  });

  it('ignores pages outside the report', () => {
    expect(reportOrigin('/glossary')).toBeNull();
    expect(reportOrigin('/')).toBeNull();
  });

  it('recognises the Rounds view', () => {
    expect(isRoundsUrl('/report/rounds/abc_3?match=abc')).toBe(true);
    expect(isRoundsUrl('/report/matches/abc')).toBe(false);
  });
});
