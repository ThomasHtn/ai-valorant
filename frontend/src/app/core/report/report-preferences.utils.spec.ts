import { DEFAULT_PREFERENCES } from './report-preferences.constants';
import { parsePreferences } from './report-preferences.utils';

describe('report preferences utils', () => {
  it('reads saved preferences', () => {
    const saved = {
      reference: 'hist',
      playerReference: 'top',
      colours: false,
      samples: true,
      referenceValues: true,
    };
    expect(parsePreferences(JSON.stringify(saved))).toEqual(saved);
  });

  it('gives preferences saved before the player reference existed the opponents default', () => {
    const saved = { reference: 'hist', colours: false, samples: true, referenceValues: true };
    expect(parsePreferences(JSON.stringify(saved))).toEqual({ ...saved, playerReference: 'opp' });
  });

  it('falls back to the defaults on missing or malformed values', () => {
    expect(parsePreferences(null)).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences('{oops')).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences(JSON.stringify({ reference: 'moon', colours: 'yes' }))).toEqual(
      DEFAULT_PREFERENCES,
    );
  });
});
