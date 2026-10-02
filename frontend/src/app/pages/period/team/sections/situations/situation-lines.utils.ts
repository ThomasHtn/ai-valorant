import { Rate } from '@core/common/common.model';
import { Situations } from '@core/periods/team.model';
import { GapLine } from '@shared/gap-list/gap-list.model';

/** The other side of a rate: tries that were not a success. */
function failures(rate: Rate): Rate {
  const count = rate.total - rate.count;
  return { count, total: rate.total, value: rate.total ? count / rate.total : null };
}

/**
 * Rounds won after each numbers situation, then the two swings a coach watches: holding a 2-player
 * lead (a throw is a loss) and winning from 2 down.
 */
export function situationLines(situations: Situations): GapLine[] {
  const { throws, comebacks } = situations;
  return [
    ...situations.states.map((row) => ({ label: row.state, squad: row.squad, reference: row.top })),
    {
      label: "2 joueurs d'avance ou plus",
      detail: `${throws.squad.count} throws`,
      squad: failures(throws.squad),
      reference: throws.reference ? failures(throws.reference) : null,
    },
    {
      label: '2 joueurs de moins ou pire',
      detail: `${comebacks.squad.count} comebacks`,
      squad: comebacks.squad,
      reference: comebacks.reference,
    },
  ];
}
