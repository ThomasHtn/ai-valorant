import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { longDay } from '@core/format/format.utils';
import { EveningMatches } from '@core/report/matches.model';
import { RoundLine } from '@core/report/rounds.model';
import { Badge } from '@shared/badge/badge';
import { MapThumb } from '@shared/game-art/map-thumb';

import { startTime, stripItems } from '../matches.utils';

/** A square of a mini strip: a round won or lost, or the gap of a side swap. */
interface MiniSquare {
  key: string;
  won: boolean | null;
}

/** A match card ready to draw. */
interface MatchCard {
  matchId: string;
  mapName: string;
  time: string;
  won: boolean;
  score: string;
  squares: MiniSquare[];
}

interface SessionBlock {
  day: string;
  title: string;
  record: string;
  good: boolean;
  count: string;
  cards: MatchCard[];
}

/**
 * Index of the Matchs view: every session of the period, newest first, each match as a card with
 * its score and one square per round (green won, red lost), so how a match went reads before
 * opening it. A card opens the match on its own page.
 */
@Component({
  selector: 'app-session-grid',
  imports: [RouterLink, Badge, MapThumb],
  templateUrl: './session-grid.html',
  host: { class: 'flex flex-col gap-10' },
})
export class SessionGrid {
  public readonly evenings = input.required<readonly EveningMatches[]>();
  /** Rounds of the period by match, in game order; a match without them draws no strip. */
  public readonly rounds = input<ReadonlyMap<string, readonly RoundLine[]>>(new Map());

  protected readonly sessions = computed<SessionBlock[]>(() =>
    this.evenings().map((evening) => ({
      day: evening.day,
      title: longDay(evening.day),
      record: `${evening.wins}V - ${evening.losses}D`,
      good: evening.wins >= evening.losses,
      count: `${evening.matches.length} match${evening.matches.length > 1 ? 's' : ''}`,
      cards: evening.matches.map((match) => ({
        matchId: match.matchId,
        mapName: match.mapName,
        time: startTime(match.startedAt),
        won: match.won,
        score: `${match.roundsWon}-${match.roundsLost}`,
        squares: stripItems(this.rounds().get(match.matchId) ?? []).map((item) =>
          item.kind === 'swap'
            ? { key: item.key, won: null }
            : { key: `r${item.cell.roundNumber}`, won: item.cell.won },
        ),
      })),
    })),
  );
}
