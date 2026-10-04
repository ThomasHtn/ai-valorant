import { describe, expect, it } from 'vitest';

import { placeUnder } from './popover.utils';

const viewport = { width: 1000, height: 800 };
const trigger = { left: 100, right: 300, bottom: 50 } as DOMRect;

describe('placeUnder', () => {
  it('drops the panel under its trigger, left edges aligned', () => {
    expect(placeUnder(trigger, 400, viewport)).toEqual({
      top: 56,
      left: 100,
      width: 400,
      maxHeight: 732,
    });
  });

  it('slides back inside the window', () => {
    const near = { left: 800, right: 900, bottom: 50 } as DOMRect;
    expect(placeUnder(near, 400, viewport).left).toBe(588);
  });

  it('narrows to the window on phones', () => {
    expect(placeUnder(trigger, 600, { width: 360, height: 700 })).toMatchObject({
      left: 12,
      width: 336,
    });
  });

  it('aligns right edges on request', () => {
    expect(placeUnder(trigger, 150, viewport, 'end').left).toBe(150);
  });
});
