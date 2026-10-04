import { Reference } from '@core/common/enums.model';

import { ROLE_PLURALS } from './players.constants';

/** Who a player is measured against, in the words of a sentence and of a legend. */
export interface PlayerReferenceNames {
  /** 'les initiateurs des équipes affrontées', 'ses propres matchs avant septembre'. */
  sentence: string;
  /** 'Initiateurs adverses', 'Avant septembre'. */
  short: string;
}

/**
 * Names of a player's reference: players of his role among the opponents or the top ranked, or his
 * own matches before the period (`history` is the period's 'Avant septembre').
 */
export function playerReferenceNames(
  reference: Reference,
  role: string,
  history: string,
): PlayerReferenceNames {
  const plural = ROLE_PLURALS[role] ?? 'joueurs';
  const title = `${plural.charAt(0).toUpperCase()}${plural.slice(1)}`;
  switch (reference) {
    case 'opp':
      return { sentence: `les ${plural} des équipes affrontées`, short: `${title} adverses` };
    case 'top':
      return { sentence: `les ${plural} du top ranked`, short: `${title} du top ranked` };
    case 'hist':
      return { sentence: `ses propres matchs ${history.toLowerCase()}`, short: history };
  }
}
