import { POPOVER_GAP_PX, POPOVER_MARGIN_PX } from './popover.constants';
import { PopoverPlacement } from './popover.model';

/**
 * Panel under its trigger, left edges aligned (right edges for `align: 'end'`), slid back inside
 * the window when it would overflow and narrowed to the window on phones.
 */
export function placeUnder(
  trigger: DOMRect,
  wantedWidth: number,
  viewport: { width: number; height: number },
  align: 'start' | 'end' = 'start',
): PopoverPlacement {
  const width = Math.min(wantedWidth, viewport.width - 2 * POPOVER_MARGIN_PX);
  const preferred = align === 'start' ? trigger.left : trigger.right - width;
  const left = Math.max(
    POPOVER_MARGIN_PX,
    Math.min(preferred, viewport.width - width - POPOVER_MARGIN_PX),
  );
  const top = trigger.bottom + POPOVER_GAP_PX;
  return { top, left, width, maxHeight: viewport.height - top - POPOVER_MARGIN_PX };
}

/** Pins a `popover` element at a placement; the browser's centring defaults are undone in CSS. */
export function applyPlacement(panel: HTMLElement, placement: PopoverPlacement): void {
  panel.style.top = `${placement.top}px`;
  panel.style.left = `${placement.left}px`;
  panel.style.width = `${placement.width}px`;
  panel.style.maxHeight = `${placement.maxHeight}px`;
}

/** Root font size in pixels, to turn a panel width in rem into pixels. */
export function remToPx(rem: number): number {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}
