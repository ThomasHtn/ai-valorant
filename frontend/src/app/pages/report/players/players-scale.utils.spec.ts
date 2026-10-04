import { describe, expect, it } from 'vitest';

import { statReach } from './players-scale.utils';

describe('statReach', () => {
  it('places a value on its fixed scale', () => {
    expect(statReach('acs', 200, 1, 'int')).toBeCloseTo(0.5);
    expect(statReach('acs', 400, 1, 'int')).toBe(1);
    expect(statReach('acs', 50, 1, 'int')).toBeCloseTo(0.04);
  });

  it('flips figures where lower is better', () => {
    expect(statReach('zeroDmg', 0.3, -1, 'pct')).toBeCloseTo(0.75);
  });

  it('falls back to 0..1 for rates and gives up on unknown means', () => {
    expect(statReach('afterFb', 0.75, 1, 'pct')).toBeCloseTo(0.75);
    expect(statReach('loadout', 3900, 0, 'int')).toBeNull();
    expect(statReach('acs', null, 1, 'int')).toBeNull();
  });
});
