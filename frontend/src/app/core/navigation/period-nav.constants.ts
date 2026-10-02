import { LucideMap, LucideShieldHalf, LucideUser } from '@lucide/angular';

import { PeriodTab, TeamGroup, TeamGroupId } from './period-nav.model';

/** Pages of the period report, linked from its header. */
export const PERIOD_TABS: readonly PeriodTab[] = [
  { path: 'team', label: 'Équipe', icon: LucideShieldHalf },
  { path: 'maps', label: 'Cartes', icon: LucideMap },
  { path: 'players', label: 'Joueurs', icon: LucideUser },
];

/**
 * Parts of the team tab, in reading order; the first one opens by default. Their icons live with
 * the tab (`team-sections.constants.ts`) so the report page, loaded before its tabs, does not carry them.
 */
export const TEAM_GROUPS: readonly TeamGroup[] = [
  { id: 'summary', label: 'Synthèse' },
  { id: 'findings', label: 'Forces et faiblesses' },
  { id: 'rounds', label: 'Rounds' },
  { id: 'economy', label: 'Économie' },
  { id: 'duels', label: 'Duels et sites' },
  { id: 'group', label: 'Groupe' },
];

export const DEFAULT_TEAM_GROUP: TeamGroupId = 'summary';
