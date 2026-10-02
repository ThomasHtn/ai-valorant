/** Report page link: full header height, its amber underline laid over the header's rule. */
export const PERIOD_TAB_CLASS = [
  'focus-ring-inset relative flex items-center gap-2 py-2.5 text-[0.9375rem] font-semibold !text-text-secondary no-underline transition-colors hover:!text-text-primary sm:py-0',
  "after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:content-['']",
  'aria-[current=page]:!text-text-primary aria-[current=page]:after:bg-brand-500',
].join(' ');
