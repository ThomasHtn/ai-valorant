import { describe, expect, it } from 'vitest';

import { clampUnit, crossPath, diamondPath, trianglePath } from './minimap-canvas.utils';

describe('minimap marker paths', () => {
  it('centres the diamond on the point', () => {
    expect(diamondPath(0, 0, 1)).toBe('M0 -1.3L1.3 0L0 1.3L-1.3 0Z');
  });

  it('draws the triangle above and below the point', () => {
    expect(trianglePath(0, 0, 1)).toBe('M0 -1.2L1.1 0.8L-1.1 0.8Z');
  });

  it('crosses through the point', () => {
    expect(crossPath(1, 1, 0.5)).toBe('M0.5 0.5L1.5 1.5M1.5 0.5L0.5 1.5');
  });

  it('clamps to the image', () => {
    expect(clampUnit(-0.2)).toBe(0);
    expect(clampUnit(1.4)).toBe(1);
    expect(clampUnit(0.3)).toBe(0.3);
  });
});
