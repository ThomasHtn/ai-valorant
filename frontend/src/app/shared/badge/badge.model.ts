import { LucideIcon } from '@lucide/angular';

/** Look of one badge kind: an optional leading icon and the Tailwind classes of the pill. */
export interface BadgeStyle {
  icon: LucideIcon | null;
  /** Colour of the pill: background, text and ring. */
  tint: string;
  /** Colour of the icon when it differs from the text. */
  iconTint?: string;
}

export type BadgeSize = 'sm' | 'md';
