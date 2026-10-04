import { ringDash, ringTick } from './ring-gauge.utils';

describe('ring gauge', () => {
  it('turns a share into a dash of a 100-long circle, clamped', () => {
    expect(ringDash(0.48)).toBe('48 52');
    expect(ringDash(1.4)).toBe('100 0');
    expect(ringDash(-1)).toBe('0 100');
  });

  it('puts a half-way tick at the bottom of the ring', () => {
    const tick = ringTick(0.5);
    expect(tick.x1).toBeCloseTo(18);
    expect(tick.y2).toBeGreaterThan(tick.y1);
  });
});
