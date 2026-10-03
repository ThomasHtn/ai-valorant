/**
 * Drawing box of the histogram in CSS pixels. `width` is only the default: the chart draws at its
 * container's width, so the height and the texts stay at their real size.
 */
export const HISTOGRAM_BOX = { width: 1000, height: 310, left: 52, right: 20, top: 50, bottom: 64 };

/** Gap between two bars, in viewBox units on each side. */
export const BAR_GAP = 2;

/** Medians closer than this (viewBox units) get their labels on two rows. */
export const MEDIAN_LABEL_ROOM = 220;

/** Room a median label needs on its side of the line, about its width at 15 px. */
export const MEDIAN_LABEL_WIDTH = 230;

/** Gap between a median line and its label, and height of a label row (viewBox units). */
export const MEDIAN_LABEL_GAP = 6;
export const MEDIAN_ROW_HEIGHT = 18;

/** Squad bars and top ranked outlines. */
export const SQUAD_COLOUR = 'var(--color-squad)';
export const TOP_COLOUR = 'var(--color-top)';
