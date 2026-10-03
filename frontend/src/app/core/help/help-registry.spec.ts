import { HELP_SECTIONS, helpFor, STAT_HELP } from './help-registry';

describe('help registry', () => {
  it('never defines the same key in two sections', () => {
    const total = HELP_SECTIONS.reduce((sum, s) => sum + Object.keys(s.entries).length, 0);
    expect(Object.keys(STAT_HELP).length).toBe(total);
  });

  it('looks an explanation up by key', () => {
    expect(helpFor('roundsWon')?.title).toBe('Rounds gagnés');
    expect(helpFor('unknown')).toBeNull();
    expect(helpFor(null)).toBeNull();
  });
});
