import { GapChipSize, GapChipTone } from './gap-chip.model';

/** Fill and leading edge per tone: the table cell tints, so a chip and a cell read alike. */
export const GAP_CHIP_TONES: Record<GapChipTone, string> = {
  good: 'border-rating-good bg-rating-good/20',
  bad: 'border-rating-bad bg-rating-bad/22',
  neutral: 'border-edge-strong bg-text-primary/8',
};

/** Box and figure size: `lg` heads a card, `sm` sits at the end of a one-line row. */
export const GAP_CHIP_SIZES: Record<GapChipSize, { box: string; value: string }> = {
  lg: { box: 'min-w-[5.25rem] px-2.5 py-1.5', value: 'font-display text-[1.375rem] leading-none' },
  sm: { box: 'min-w-[3.75rem] px-2 py-0.5', value: 'text-base leading-snug' },
};
