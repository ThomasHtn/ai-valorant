import { AgentRole } from '@core/game-assets/game-assets.model';

/** Roles of the agent columns, in the order a team is usually read. */
export const ROLE_ORDER: readonly AgentRole[] = ['Duelist', 'Controller', 'Initiator', 'Sentinel'];

/** Agents listed per role: the most played on the map. */
export const AGENTS_PER_ROLE = 4;

/** Under this many squad situations a habit line is greyed. */
export const MIN_HABIT_SAMPLE = 10;

/** Under this many plants or duels a squad share is greyed. */
export const MIN_SHARE_SAMPLE = 5;

/** A squad share this far from the top ranked one is marked red. */
export const SHARE_GAP = 0.12;

/** Cost per match under which a habit reads as even. */
export const EVEN_COST = 0.1;

/** Callouts written on the plant minimaps: the sites. */
export const SITE_CALLOUT = /site$/i;
