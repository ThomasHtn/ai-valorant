/** Drawing box of the histogram, in viewBox units (the SVG scales to its container's width). */
export const HISTOGRAM_BOX = { width: 1000, height: 380, left: 52, right: 20, top: 40, bottom: 64 };

/** Gap between two bars, in viewBox units on each side. */
export const BAR_GAP = 2;

/** Medians closer than this (viewBox units) get their labels on two rows. */
export const MEDIAN_LABEL_ROOM = 220;

/** Room a median label needs on its side of the line, about its width at 13 px. */
export const MEDIAN_LABEL_WIDTH = 210;

/** Gap between a median line and its label, and height of a label row (viewBox units). */
export const MEDIAN_LABEL_GAP = 6;
export const MEDIAN_ROW_HEIGHT = 16;

/** Squad bars and top ranked outlines. */
export const SQUAD_COLOUR = 'var(--color-squad)';
export const TOP_COLOUR = 'var(--color-top)';
