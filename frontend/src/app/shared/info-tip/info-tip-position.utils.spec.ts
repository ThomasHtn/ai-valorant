import { placeTip } from './info-tip-position.utils';

const viewport = { width: 1000, height: 800 };
const tip = { width: 300, height: 200 };

describe('placeTip', () => {
  it('centres the tip below the icon', () => {
    const anchor = { top: 100, bottom: 116, left: 492, width: 16 };
    expect(placeTip(anchor, tip, viewport)).toEqual({
      top: 124,
      left: 350,
      above: false,
    });
  });

  it('keeps the tip inside the window', () => {
    const anchor = { top: 100, bottom: 116, left: 970, width: 16 };
    expect(placeTip(anchor, tip, viewport).left).toBe(692);
  });

  it('opens above the icon when there is no room below', () => {
    const anchor = { top: 700, bottom: 716, left: 492, width: 16 };
    const placement = placeTip(anchor, tip, viewport);
    expect(placement.above).toBe(true);
    expect(placement.top).toBe(492);
  });
});
