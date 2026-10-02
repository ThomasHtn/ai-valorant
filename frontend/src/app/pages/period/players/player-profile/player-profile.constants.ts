import {
  LucideChartLine,
  LucideColumns3,
  LucideCrosshair,
  LucideListOrdered,
  LucideZap,
} from '@lucide/angular';

import { TabItem } from '@shared/tabs/tabs.model';

/** Parts of a player profile; the duels part only shows when the player has duel maps. */
export const PLAYER_SECTIONS: readonly TabItem[] = [
  { id: 'summary', label: 'Résumé', icon: LucideChartLine },
  { id: 'stats', label: 'Toutes les stats', icon: LucideListOrdered },
  { id: 'impact', label: 'Impact et armes', icon: LucideZap },
  { id: 'splits', label: 'Par side, agent, carte', icon: LucideColumns3 },
  { id: 'duels', label: "Duels d'ouverture", icon: LucideCrosshair },
];

export const DEFAULT_PLAYER_SECTION = 'summary';
