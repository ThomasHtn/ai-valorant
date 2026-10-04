import { describe, expect, it } from 'vitest';

import {
  clampUnit,
  crossPath,
  diamondPath,
  nextRotation,
  rotatePoint,
  trianglePath,
} from './minimap-canvas.utils';

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

describe('rotatePoint', () => {
  it('turns the right edge to the bottom on a quarter turn clockwise', () => {
    expect(rotatePoint({ x: 1, y: 0.5 }, 90)).toEqual({ x: 0.5, y: 1 });
  });

  it('turns the top edge to the left on three quarter turns', () => {
    expect(rotatePoint({ x: 0.5, y: 0 }, 270)).toEqual({ x: 0, y: 0.5 });
  });

  it('keeps the other fields and leaves an unturned point alone', () => {
    expect(rotatePoint({ x: 0.2, y: 0.3, name: 'A' }, 180)).toEqual({ x: 0.8, y: 0.7, name: 'A' });
    expect(rotatePoint({ x: 0.2, y: 0.3 }, 0)).toEqual({ x: 0.2, y: 0.3 });
  });
});

describe('nextRotation', () => {
  it('cycles through the four quarter turns', () => {
    expect([0, 90, 180, 270].map(nextRotation)).toEqual([90, 180, 270, 0]);
  });
});
