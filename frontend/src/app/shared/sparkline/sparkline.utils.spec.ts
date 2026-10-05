import { buildSparkline } from './sparkline.utils';

describe('buildSparkline', () => {
  it('skips missing months and ends on the last known one', () => {
    const view = buildSparkline([200, null, 240, 220, null], 230);
    expect(view.line.split(' L').length).toBe(3);
    expect(view.end?.x).toBe(73);
    expect(view.reference).not.toBeNull();
  });

  it('draws nothing without values', () => {
    expect(buildSparkline([null, null], 230).end).toBeNull();
  });
});
