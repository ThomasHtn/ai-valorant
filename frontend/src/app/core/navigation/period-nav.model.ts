import { LucideIcon } from '@lucide/angular';

/** A page of the period report (team, maps, players). */
export interface PeriodTab {
  path: 'team' | 'maps' | 'players';
  label: string;
  icon: LucideIcon;
}

/** Ids of the team tab's parts, also the last segment of their URL (`/periods/team/rounds`). */
export type TeamGroupId = 'summary' | 'findings' | 'rounds' | 'economy' | 'duels' | 'group';

/** One part of the team tab, a few related sections read together. */
export interface TeamGroup {
  id: TeamGroupId;
  label: string;
}
