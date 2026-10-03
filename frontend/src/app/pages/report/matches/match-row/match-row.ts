import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AgentIcon } from '@shared/game-art/agent-icon';
import { MapThumb } from '@shared/game-art/map-thumb';

import { MatchRowView } from './match-row.model';

/** Text colour of a digest tone; a neutral figure stays white. */
const TONE_TEXT = { good: 'text-rating-good', bad: 'text-rating-bad' } as const;

/**
 * One match of the Matchs list, read left to right: which match and its score, how its rounds went
 * (strip, halves, pistols, opening duels), what decided it in a few sentences, then who played and
 * how. The whole row opens the match.
 */
@Component({
  selector: 'app-match-row',
  imports: [RouterLink, AgentIcon, MapThumb],
  templateUrl: './match-row.html',
  host: { class: 'block' },
})
export class MatchRow {
  public readonly match = input.required<MatchRowView>();

  protected readonly best = computed(() => this.match().lineup[0] ?? null);
  protected readonly toneText = TONE_TEXT;
}
