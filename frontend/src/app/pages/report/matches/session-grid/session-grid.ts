import { Component, computed, input } from '@angular/core';

import { longDay } from '@core/format/format.utils';
import { EveningMatches } from '@core/report/matches.model';
import { RoundLine } from '@core/report/rounds.model';
import { Badge } from '@shared/badge/badge';

import { MatchRow } from '../match-row/match-row';
import { MatchRowView } from '../match-row/match-row.model';
import { matchRowView } from '../match-row/match-row.utils';

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
 * sums it up (score, halves, what decided it, lineup), so a match reads before it is opened.
 * A row opens the match on its own page.
 */
@Component({
  selector: 'app-session-grid',
  imports: [Badge, MatchRow],
  templateUrl: './session-grid.html',
  host: { class: 'flex flex-col gap-8' },
})
export class SessionGrid {
  public readonly evenings = input.required<readonly EveningMatches[]>();
  /** Rounds of the period by match, in game order; a match without them shows no halves or fact. */
  public readonly rounds = input<ReadonlyMap<string, readonly RoundLine[]>>(new Map());

  protected readonly sessions = computed<SessionBlock[]>(() =>
    this.evenings().map((evening) => ({
      day: evening.day,
      title: longDay(evening.day),
      record: `${evening.wins}V - ${evening.losses}D`,
      good: evening.wins >= evening.losses,
      count: `${evening.matches.length} match${evening.matches.length > 1 ? 's' : ''}`,
      rows: evening.matches.map((match) =>
        matchRowView(match, this.rounds().get(match.matchId) ?? []),
      ),
    })),
  );
}
