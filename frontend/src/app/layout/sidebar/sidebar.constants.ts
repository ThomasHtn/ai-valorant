/** Navigation row: icon, label over its hint, optional score; the active one gets an amber bar and tint. */
export const NAV_ROW_CLASS =
  "group focus-ring-inset relative flex min-h-12 w-full items-center gap-3 px-5 py-2 text-[0.9375rem] font-medium !text-text-secondary no-underline transition-colors before:absolute before:inset-y-0 before:left-0 before:w-1 before:content-[''] hover:bg-brand-500/8 hover:!text-text-primary";
export const NAV_ROW_ACTIVE_CLASS =
  'bg-linear-to-r from-brand-500/20 to-transparent !text-brand-400 before:bg-brand-500';

/** Rows grouped under the report being read sit tighter, inside its frame. */
export const NAV_REPORT_ROW_CLASS = `${NAV_ROW_CLASS} !px-4`;

/** Plain line under a row's label saying what the page shows. */
export const NAV_HINT_CLASS = 'truncate text-[0.8125rem] leading-snug font-normal text-text-muted';
