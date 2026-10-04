import { longDay } from '@core/format/format.utils';
import { MatchDetail } from '@core/report/matches.model';
import { Crumb } from '@shared/breadcrumb/breadcrumb.model';

/** 'Matchs > Mercredi 30 septembre > Abyss 3-13': the steps above the open match. */
export function matchCrumbs(match: MatchDetail | null): Crumb[] {
  const steps: Crumb[] = [{ label: 'Matchs', link: ['/report/matches'] }];
  if (match) {
    steps.push(
      { label: longDay(match.day), link: null },
      { label: `${match.mapName} ${match.roundsWon}-${match.roundsLost}`, link: null },
    );
  }
  return steps;
}

/** Rounds right before and after one in its match; null at either end. */
export function roundNeighbours(
  roundNumber: number,
  roundCount: number,
): { previous: number | null; next: number | null } {
  return {
    previous: roundNumber > 1 ? roundNumber - 1 : null,
    next: roundNumber < roundCount ? roundNumber + 1 : null,
  };
}
