import { Rate } from '@core/common/common.model';
import { pointsChange, signedPoints } from '@core/format/format.utils';
import { BUY_LABELS, SIDE_LABELS } from '@core/format/labels.constants';
import { Economy } from '@core/periods/team.model';
import { rateAgainst } from '@core/rating/rating.utils';

import { AGAINST_LABELS, BUY_RESULT_MIN_ROUNDS, ROUND_BUYS } from './buy-results.constants';
import { BuyResultGroup, BuyResultLine } from './buy-results.model';

function line(label: string, squad: Rate, top: Rate): BuyResultLine {
  const muted = squad.total < BUY_RESULT_MIN_ROUNDS;
  return {
    label,
    squad,
    top,
    rating: muted ? 'unknown' : rateAgainst(squad.value, top.value),
    gap: signedPoints(pointsChange(squad, top) ?? 0),
    muted,
  };
}

/**
 * Rounds won by buy: pistols by side, then each of the squad's buys against each of the
 * opponents'. Situations never played are left out, and so is a buy with none of them.
 */
export function buyResultGroups(economy: Economy): BuyResultGroup[] {
  const pistols: BuyResultGroup = {
    label: BUY_LABELS.pistol,
    lines: economy.pistols
      .filter((p) => p.squad.total)
      .map((p) => line(`En ${SIDE_LABELS[p.side].toLowerCase()}`, p.squad, p.top)),
  };
  const buys = ROUND_BUYS.map((own) => ({
    label: BUY_LABELS[own],
    lines: ROUND_BUYS.flatMap((opp) => {
      const cell = economy.buyMatrix.find((m) => m.ownBuy === own && m.oppBuy === opp);
      return cell && cell.squad.total ? [line(AGAINST_LABELS[opp], cell.squad, cell.top)] : [];
    }),
  }));
  return [pistols, ...buys].filter((group) => group.lines.length);
}
