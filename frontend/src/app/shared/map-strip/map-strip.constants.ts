import { StripTone } from '@core/report/gap.utils';

/** Ground of a per-map cell per tone: the stronger red marks a loss of two rounds or more. */
export const STRIP_FILLS: Record<StripTone, string> = {
  'strong-bad': 'bg-accent-red/75',
  bad: 'bg-accent-red/35',
  good: 'bg-rating-good/60',
  even: 'bg-text-primary/8',
  none: 'bg-text-primary/4 text-text-muted',
};
