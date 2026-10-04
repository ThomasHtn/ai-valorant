import { MatchSummary } from '@core/report/matches.model';
import { RoundLine } from '@core/report/rounds.model';

import { matchDigest } from '../match-digest/match-digest.utils';
import { matchLength, startTime, stripItems } from '../matches.utils';
import { MatchRowView } from './match-row.model';

/** A match ready to draw as a row or a card; without its rounds it draws no strip or facts. */
export function matchRowView(match: MatchSummary, rounds: readonly RoundLine[]): MatchRowView {
  return {
    matchId: match.matchId,
    mapName: match.mapName,
    when: match.lengthMs
      ? `${startTime(match.startedAt)} · ${matchLength(match.lengthMs)}`
      : startTime(match.startedAt),
    won: match.won,
    score: `${match.roundsWon}-${match.roundsLost}`,
    squares: stripItems(rounds).map((item) =>
      item.kind === 'swap'
        ? { key: item.key, won: null }
        : { key: `r${item.cell.roundNumber}`, won: item.cell.won },
    ),
    digest: matchDigest(match, rounds),
    lineup: match.lineup.map((p) => ({
      name: p.name,
      agent: p.agent,
      acs: Math.round(p.acs),
      title: `${p.name} (${p.agent}) : ${Math.round(p.acs)} ACS, ${p.kills}/${p.deaths}`,
    })),
  };
}
