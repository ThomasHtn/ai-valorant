import { agentIcon, agentRole, assetSlug, mapBanner, weaponIcon } from './game-assets.utils';

describe('game assets', () => {
  it('slugs names the way the fetch script saves them', () => {
    expect(assetSlug('KAY/O')).toBe('kayo');
    expect(assetSlug('The Range')).toBe('the-range');
  });

  it('finds known agents, maps and weapons', () => {
    expect(agentIcon('KAY/O')).toBe('assets/valorant/agents/kayo.webp');
    expect(agentRole('Cypher')).toBe('Sentinel');
    expect(mapBanner('Split')).toBe('assets/valorant/maps/split-banner.webp');
    expect(weaponIcon('Vandal')).toBe('assets/valorant/weapons/vandal.webp');
  });

  it('returns null for names without an image', () => {
    expect(agentIcon('Nobody')).toBeNull();
    expect(mapBanner('The Range')).toBeNull();
    expect(weaponIcon('Spike')).toBeNull();
  });
});
