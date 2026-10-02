import { Tone } from '@core/common/enums.model';

/** Colour of the score or count after a tab label. */
export const TAB_NOTE_CLASS: Record<Tone, string> = {
  good: 'text-rating-good',
  bad: 'text-rating-bad',
  neutral: 'text-text-muted',
};

/**
 * Sections of a page or sheet, as on ValoQuests' overview: a full-width bar on a hairline, its
 * tabs sharing the width, the one on screen lit in amber over a 2px underline.
 */
export const SEGMENT_ROW_CLASS =
  'scroll-subtle flex w-full overflow-x-auto shadow-[inset_0_-1px_0_var(--color-edge)]';
export const SEGMENT_CLASS = [
  'focus-ring-inset relative flex min-h-12 min-w-max flex-1 basis-0 cursor-pointer items-center justify-center gap-2 px-6 py-2',
  'font-display text-[1.0625rem] leading-[1.1] font-semibold tracking-[0.06em] whitespace-nowrap uppercase no-underline',
  "transition-colors after:absolute after:inset-x-0 after:bottom-0 after:z-[1] after:h-0.5 after:bg-brand-500 after:transition-opacity after:content-['']",
  'motion-reduce:transition-none motion-reduce:after:transition-none',
].join(' ');
export const SEGMENT_IDLE_CLASS =
  '!text-text-secondary after:opacity-0 hover:bg-brand-500/4 hover:!text-text-primary hover:after:opacity-50';
export const SEGMENT_ACTIVE_CLASS = 'bg-brand-500/8 !text-brand-400 after:opacity-100';

/** Picker row; scrolls sideways on a phone. */
export const PICKER_ROW_CLASS = 'scroll-subtle -mx-1 flex gap-2 overflow-x-auto px-1 py-1';

/**
 * Map tile: the banner fills it, faded until selected or hovered. The frame is drawn by `after:`
 * so it sits above the picture.
 */
export const BANNER_CLASS =
  "group/pick focus-ring relative isolate flex h-14 w-40 shrink-0 cursor-pointer items-end justify-between gap-2 overflow-hidden bg-surface-700 px-3 pb-2 text-left no-underline after:pointer-events-none after:absolute after:inset-0 after:ring-inset after:content-['']";
export const BANNER_IDLE_CLASS = 'after:ring-1 after:ring-edge-strong hover:after:ring-text-muted';
export const BANNER_ACTIVE_CLASS = 'after:ring-2 after:ring-brand-500';

/** Player pill: portrait of the main agent, then the name; only the selected one is outlined. */
export const AVATAR_CLASS =
  'focus-ring flex min-h-11 shrink-0 cursor-pointer items-center gap-2.5 py-1.5 pr-4 pl-1.5 text-[0.9375rem] font-semibold whitespace-nowrap no-underline ring-inset transition-colors';
export const AVATAR_IDLE_CLASS =
  'bg-text-primary/4 !text-text-secondary hover:bg-text-primary/8 hover:!text-text-primary';
export const AVATAR_ACTIVE_CLASS = 'bg-brand-500/12 !text-text-primary ring-1 ring-brand-500/60';
