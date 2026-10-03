import { Component, computed, input } from '@angular/core';

import { longDay } from '@core/format/format.utils';
import { EveningMatches, MatchSummary } from '@core/report/matches.model';
import { RoundLine } from '@core/report/rounds.model';
import { Badge } from '@shared/badge/badge';

import { matchDigest } from '../match-digest/match-digest.utils';
import { MatchRow } from '../match-row/match-row';
import { MatchRowView } from '../match-row/match-row.model';
import { matchLength, startTime, stripItems } from '../matches.utils';

interface SessionBlock {
  day: string;
  title: string;
  record: string;
  good: boolean;
  count: string;
  rows: MatchRowView[];
}

/**
 * Index of the Matchs view: every session of the period, newest first, each match as a row that
 * sums it up (score, rounds, halves, what decided it, lineup), so a match reads before it is opened.
 * A row opens the match on its own page.
 */
@Component({
  selector: 'app-session-grid',
  imports: [Badge, MatchRow],
  templateUrl: './session-grid.html',
  host: { class: 'flex flex-col gap-10' },
})
export class SessionGrid {
  public readonly evenings = input.required<readonly EveningMatches[]>();
  /** Rounds of the period by match, in game order; a match without them draws no strip or facts. */
  public readonly rounds = input<ReadonlyMap<string, readonly RoundLine[]>>(new Map());

  protected readonly sessions = computed<SessionBlock[]>(() =>
    this.evenings().map((evening) => ({
      day: evening.day,
      title: longDay(evening.day),
      record: `${evening.wins}V - ${evening.losses}D`,
      good: evening.wins >= evening.losses,
      count: `${evening.matches.length} match${evening.matches.length > 1 ? 's' : ''}`,
      rows: evening.matches.map((match) => this.row(match)),
    })),
  );

  private row(match: MatchSummary): MatchRowView {
    const rounds = this.rounds().get(match.matchId) ?? [];
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
}
