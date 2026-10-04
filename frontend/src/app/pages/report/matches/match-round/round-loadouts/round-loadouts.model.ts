import { HoverTipContent } from '@shared/hover-tip/hover-tip.model';

/** One player's buy, ready to draw on one compact line. */
export interface LoadoutLine {
  name: string;
  agent: string;
  weapon: string;
  weaponIcon: string | null;
  armor: string;
  armorIcon: string | null;
  /** '4 600'. */
  value: string;
  tip: HoverTipContent;
}

/** One team's buys and the value its five players carry into the round. */
export interface TeamLoadout {
  title: string;
  /** '22 000 crédits'. */
  total: string;
  lines: LoadoutLine[];
}
