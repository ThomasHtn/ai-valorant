import { ASSETS_ROOT } from './game-assets.constants';
import { RANK_TIERS, UNDIVIDED_TIER } from './rank.constants';
import { RankDisplay } from './rank.model';

const RANK_NAME = /^\s*([a-zéèêëàâîïôöûüç]+)(?:\s+([123]))?\s*$/i;

/**
 * Reads a rank name, English ('Platinum 1', as Henrik writes it) or French ('Platine 1'), into its
 * icon slug and French name; null for anything else ('Unranked', '').
 */
export function parseRank(name: string | null | undefined): RankDisplay | null {
  const match = RANK_NAME.exec(name ?? '');
  if (!match) {
    return null;
  }
  const word = match[1].toLowerCase();
  const tier = RANK_TIERS.find((t) => t.en === word || t.fr.toLowerCase() === word);
  if (!tier) {
    return null;
  }
  const division = tier.en === UNDIVIDED_TIER ? null : (match[2] ?? null);
  return {
    slug: division ? `${tier.en}-${division}` : tier.en,
    label: division ? `${tier.fr} ${division}` : tier.fr,
  };
}

/** Icon of a rank (from valorant-api's competitive tiers). */
export function rankIcon(rank: RankDisplay): string {
  return `${ASSETS_ROOT}/ranks/${rank.slug}.webp`;
}
