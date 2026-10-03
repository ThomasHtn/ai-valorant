import { dayMonth, roundLabel } from '@core/format/format.utils';
import { RewatchRound } from '@core/report/findings.model';
import { roundLink } from '@core/report/round-ref.utils';

/** A rewatch link ready to draw: its text and router commands. */
export interface RewatchLink {
  key: string;
  label: string;
  commands: string[];
}

/**
 * Links of rounds to rewatch, at most `max`: '30/09 Split R14' opens the round sheet, a whole match
 * ('30/09 Split') opens the match.
 */
export function rewatchLinks(rounds: RewatchRound[], max: number): RewatchLink[] {
  return rounds.slice(0, max).map((r) =>
    r.roundNumber === null
      ? {
          key: r.matchId,
          label: `${dayMonth(r.day)} ${r.mapName}`,
          commands: ['/report/matches', r.matchId],
        }
      : {
          key: `${r.matchId}_${r.roundNumber}`,
          label: roundLabel(r.day, r.mapName, r.roundNumber),
          commands: roundLink({ matchId: r.matchId, roundNumber: r.roundNumber }),
        },
  );
}
