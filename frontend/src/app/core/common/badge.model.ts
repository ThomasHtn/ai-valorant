/**
 * What a badge stands for; it picks the badge's icon and tint (see `shared/badge/badge.constants.ts`).
 * `confirmed`, `lead` and `mixed` mirror `FindingStatus`; `good` and `bad` carry a result.
 */
export type BadgeKind =
  | 'map'
  | 'attack'
  | 'defense'
  | 'player'
  | 'confirmed'
  | 'lead'
  | 'mixed'
  | 'opponents'
  | 'top'
  | 'buy'
  | 'good'
  | 'bad'
  | 'neutral';

export interface BadgeContent {
  label: string;
  kind: BadgeKind;
}
