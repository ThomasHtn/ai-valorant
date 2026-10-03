import { dayMonth } from '@core/format/format.utils';
import { RewatchRound } from '@core/report/findings.model';
import { roundLink } from '@core/report/round-ref.utils';

/** One round chip of a match group: 'R14', opening the round sheet. */
export interface RewatchRoundLink {
  key: string;
  label: string;
  commands: string[];
}

/** Rounds to rewatch from one match: '30/09 Split' opens the match, then one chip per round. */
export interface RewatchGroup {
  key: string;
  label: string;
  commands: string[];
  rounds: RewatchRoundLink[];
}

/**
 * The first `max` rounds to rewatch, grouped by match so a date and map are written once
 * ('30/09 Split R13 R14 R19'). Matches keep their order of appearance, rounds are sorted.
 */
export function rewatchGroups(rounds: RewatchRound[], max: number): RewatchGroup[] {
  const groups = new Map<string, RewatchGroup>();
  for (const r of rounds.slice(0, max)) {
    let group = groups.get(r.matchId);
    if (!group) {
      group = {
        key: r.matchId,
        label: `${dayMonth(r.day)} ${r.mapName}`,
        commands: ['/report/matches', r.matchId],
        rounds: [],
      };
      groups.set(r.matchId, group);
    }
    if (r.roundNumber !== null && !group.rounds.some((x) => x.label === `R${r.roundNumber}`)) {
      group.rounds.push({
        key: `${r.matchId}_${r.roundNumber}`,
        label: `R${r.roundNumber}`,
        commands: roundLink({ matchId: r.matchId, roundNumber: r.roundNumber }),
      });
    }
  }
  for (const group of groups.values()) {
    group.rounds.sort((a, b) => Number(a.label.slice(1)) - Number(b.label.slice(1)));
  }
  return [...groups.values()];
}
