import {
  LucideCircleCheck,
  LucideCoins,
  LucideScanSearch,
  LucideShield,
  LucideSwords,
  LucideTrophy,
  LucideUser,
  LucideUsers,
} from '@lucide/angular';

import { BadgeKind } from '@core/common/badge.model';

import { BadgeSize, BadgeStyle } from './badge.model';

const NEUTRAL = 'bg-surface-700/60 text-text-primary ring-edge-strong';

/** Icon and tint per kind. Green and red stay reserved for results, amber for confirmed findings. */
export const BADGE_STYLES: Record<BadgeKind, BadgeStyle> = {
  map: { icon: null, tint: '' },
  attack: { icon: LucideSwords, tint: NEUTRAL, iconTint: 'text-opponent' },
  defense: { icon: LucideShield, tint: NEUTRAL, iconTint: 'text-squad' },
  player: { icon: LucideUser, tint: 'bg-squad/15 text-[#a9cdf0] ring-squad/35' },
  confirmed: { icon: LucideCircleCheck, tint: 'bg-brand-500/15 text-brand-400 ring-brand-500/45' },
  lead: { icon: LucideScanSearch, tint: 'bg-transparent text-text-secondary ring-edge-strong' },
  opponents: { icon: LucideUsers, tint: NEUTRAL, iconTint: 'text-text-muted' },
  top: { icon: LucideTrophy, tint: NEUTRAL, iconTint: 'text-accent-gold' },
  buy: { icon: LucideCoins, tint: NEUTRAL, iconTint: 'text-text-muted' },
  good: { icon: null, tint: 'bg-rating-good/15 text-rating-good ring-rating-good/40' },
  bad: { icon: null, tint: 'bg-rating-bad/15 text-rating-bad ring-rating-bad/40' },
  neutral: { icon: null, tint: NEUTRAL },
};

export const BADGE_SIZES: Record<BadgeSize, { pill: string; icon: string }> = {
  sm: { pill: 'gap-1.5 px-2.5 py-0.5 text-xs', icon: 'size-3.5' },
  md: { pill: 'gap-1.5 px-3 py-1 text-[0.9375rem]', icon: 'size-4' },
};

/** A map scope: thumbnail and name, no pill around them. */
export const MAP_TAG_CLASS = 'gap-2 text-[0.9375rem] text-text-primary';
