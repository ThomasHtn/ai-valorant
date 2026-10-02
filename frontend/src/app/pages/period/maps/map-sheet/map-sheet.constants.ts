import { LucideGauge, LucideShield, LucideSwords, LucideUser, LucideUsers } from '@lucide/angular';

import { TabItem } from '@shared/tabs/tabs.model';

/** Parts of a map sheet; the side parts only show for the sides the API returns. */
export const MAP_SECTIONS: readonly TabItem[] = [
  { id: 'summary', label: 'Résumé', icon: LucideGauge },
  { id: 'att', label: 'Attaque', icon: LucideSwords },
  { id: 'def', label: 'Défense', icon: LucideShield },
  { id: 'compositions', label: 'Compositions', icon: LucideUsers },
  { id: 'players', label: 'Joueurs', icon: LucideUser },
];

export const DEFAULT_MAP_SECTION = 'summary';
