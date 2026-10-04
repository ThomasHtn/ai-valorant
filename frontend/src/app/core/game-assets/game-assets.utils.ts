import {
  AGENT_ROLES,
  ASSETS_ROOT,
  KNOWN_ARMORS,
  KNOWN_MAPS,
  KNOWN_WEAPONS,
  ROLE_LABELS,
} from './game-assets.constants';
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

/** White role glyph ('Duelist'), or null for a role the assets do not know. */
export function roleIcon(role: string): string | null {
  return role in ROLE_LABELS ? `${ASSETS_ROOT}/roles/${role.toLowerCase()}.webp` : null;
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

/** White shield glyph of an armor ('Heavy Armor'), or null for one the assets do not know. */
export function armorIcon(armor: string): string | null {
  return KNOWN_ARMORS.has(armor) ? `${ASSETS_ROOT}/armors/${assetSlug(armor)}.webp` : null;
}

/** Picture of a table row from the API's art slug; players are drawn by their avatar agent elsewhere. */
export function artImage(type: 'map' | 'agent' | 'weapon' | 'role', slug: string): string {
  switch (type) {
    case 'map':
      return `${ASSETS_ROOT}/maps/${slug}-splash.webp`;
    case 'agent':
      return `${ASSETS_ROOT}/agents/${slug}.webp`;
    case 'weapon':
      return `${ASSETS_ROOT}/weapons/${slug}.webp`;
    case 'role':
      return `${ASSETS_ROOT}/roles/${slug}.webp`;
  }
}
