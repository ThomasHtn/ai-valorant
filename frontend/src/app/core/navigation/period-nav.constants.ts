import { LucideBookOpen, LucideMap, LucideShieldHalf, LucideUser } from '@lucide/angular';

import { PeriodTab, TeamGroup, TeamGroupId } from './period-nav.model';

/** Tabs of the period report, shared by the page's tab bar and the sidebar tree. */
export const PERIOD_TABS: readonly PeriodTab[] = [
  { path: 'team', label: 'Équipe', icon: LucideShieldHalf },
  { path: 'maps', label: 'Cartes', icon: LucideMap },
  { path: 'players', label: 'Joueurs', icon: LucideUser },
  { path: 'glossary', label: 'Glossaire', icon: LucideBookOpen },
];

/**
 * Parts of the team tab, in reading order; the first one opens by default. Their icons live with
 * the tab (`team-sections.constants.ts`) so the sidebar, which loads with the app, does not carry them.
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
