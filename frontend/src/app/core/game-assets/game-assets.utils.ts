import { AGENT_ROLES, ASSETS_ROOT, KNOWN_MAPS, KNOWN_WEAPONS } from './game-assets.constants';
import { AgentRole } from './game-assets.model';

/** File name of a game name: 'KAY/O' -> 'kayo', 'The Range' -> 'the-range'. */
export function assetSlug(name: string): string {
  return name
    .toLowerCase()
    .replace('/', '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Square portrait of an agent, or null for a name the assets do not know. */
export function agentIcon(agent: string): string | null {
  return agent in AGENT_ROLES ? `${ASSETS_ROOT}/agents/${assetSlug(agent)}.webp` : null;
}

export function agentRole(agent: string): AgentRole | null {
  return AGENT_ROLES[agent] ?? null;
}

export function roleIcon(role: AgentRole): string {
  return `${ASSETS_ROOT}/roles/${assetSlug(role)}.webp`;
}

/** Wide strip of a map (456 x 100), used by pickers and table rows. */
export function mapBanner(map: string): string | null {
  return KNOWN_MAPS.has(map) ? `${ASSETS_ROOT}/maps/${assetSlug(map)}-banner.webp` : null;
}

/** Loading screen of a map (960 x 540), behind a map sheet's header. */
export function mapSplash(map: string): string | null {
  return KNOWN_MAPS.has(map) ? `${ASSETS_ROOT}/maps/${assetSlug(map)}-splash.webp` : null;
}

/** White kill-feed silhouette of a weapon. */
export function weaponIcon(weapon: string): string | null {
  return KNOWN_WEAPONS.has(weapon) ? `${ASSETS_ROOT}/weapons/${assetSlug(weapon)}.webp` : null;
}
