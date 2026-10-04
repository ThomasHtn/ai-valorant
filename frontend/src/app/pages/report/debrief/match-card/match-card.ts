import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AgentIcon } from '@shared/game-art/agent-icon';
import { mapSplash } from '@core/game-assets/game-assets.utils';

import { MatchRowView } from '../../matches/match-row/match-row.model';

/**
 * A match of the session as a card: the map's art behind the score, one square per round, then the
 * squad's lineup by ACS. The card opens the match.
 */
@Component({
  selector: 'app-match-card',
  imports: [AgentIcon, RouterLink],
  templateUrl: './match-card.html',
})
export class MatchCard {
  public readonly match = input.required<MatchRowView>();

  protected readonly art = computed(() => mapSplash(this.match().mapName));
}
