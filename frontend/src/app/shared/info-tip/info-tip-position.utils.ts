import { TIP_GAP_PX, TIP_VIEWPORT_MARGIN_PX } from './info-tip.constants';

export interface Size {
  width: number;
  height: number;
}

/** The parts of a `DOMRect` the placement needs. */
export interface AnchorRect {
  top: number;
  bottom: number;
  left: number;
  width: number;
}

export interface TipPlacement {
  top: number;
  left: number;
  above: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Below the icon and centred on it, kept inside the window; above it when there is no room below. */
export function placeTip(anchor: AnchorRect, tip: Size, viewport: Size): TipPlacement {
  const center = anchor.left + anchor.width / 2;
  const left = clamp(
    center - tip.width / 2,
    TIP_VIEWPORT_MARGIN_PX,
    viewport.width - TIP_VIEWPORT_MARGIN_PX - tip.width,
  );
  const fitsBelow =
    anchor.bottom + TIP_GAP_PX + tip.height <= viewport.height - TIP_VIEWPORT_MARGIN_PX;
  const fitsAbove = anchor.top - TIP_GAP_PX - tip.height >= TIP_VIEWPORT_MARGIN_PX;
  const above = !fitsBelow && fitsAbove;
  return {
    top: above ? anchor.top - TIP_GAP_PX - tip.height : anchor.bottom + TIP_GAP_PX,
    left,
    above,
  };
}
