import { DEFAULT_PREFERENCES } from './report-preferences.constants';
import { hasFilters, parsePreferences } from './report-preferences.utils';

describe('report preferences utils', () => {
  it('reads saved preferences', () => {
    const saved = { reference: 'hist', colours: false, samples: true, referenceValues: true };
    expect(parsePreferences(JSON.stringify(saved), DEFAULT_PREFERENCES)).toEqual(saved);
  });

  it('falls back to the given defaults on missing or malformed values', () => {
    const defaults = { ...DEFAULT_PREFERENCES, reference: 'opp' as const };
    expect(parsePreferences(null, defaults)).toEqual(defaults);
    expect(parsePreferences('{oops', defaults)).toEqual(defaults);
    expect(
      parsePreferences(JSON.stringify({ reference: 'moon', colours: 'yes' }), defaults),
    ).toEqual(defaults);
  });

  it('tells when a filter narrows the view', () => {
    expect(hasFilters({ map: '', side: '', player: '' })).toBe(false);
    expect(hasFilters({ map: 'Split', side: '', player: '' })).toBe(true);
    expect(hasFilters({ map: '', side: 'def', player: '' })).toBe(true);
  });
});
