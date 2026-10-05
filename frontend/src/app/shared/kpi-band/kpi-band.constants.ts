/** Left edge of a headline cell per tone, as the ValoQuests gauges mark theirs. */
export const KPI_EDGES: Record<string, string> = {
  good: 'shadow-[inset_3px_0_0_var(--color-rating-good)]',
  avg: 'shadow-[inset_3px_0_0_var(--color-rating-average)]',
  bad: 'shadow-[inset_3px_0_0_var(--color-accent-red)]',
  small: 'shadow-[inset_3px_0_0_var(--color-text-muted)]',
  none: 'shadow-[inset_3px_0_0_var(--color-edge-strong)]',
};
