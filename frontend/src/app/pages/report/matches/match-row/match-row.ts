import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MapThumb } from '@shared/game-art/map-thumb';
import { HoverTip } from '@shared/hover-tip/hover-tip';

import { MatchRowView } from './match-row.model';

/** Text colour of a digest tone; a neutral figure stays white. */
const TONE_TEXT = { good: 'text-rating-good', bad: 'text-rating-bad' } as const;

/**
 * One match of the Matchs list on one line, read left to right: which match, its score, its halves,
 * the most telling fact, then who played (figures in the portrait's tip). The row opens the match.
 */
@Component({
  selector: 'app-match-row',
  imports: [RouterLink, HoverTip, MapThumb],
  templateUrl: './match-row.html',
  host: { class: 'block' },
})
export class MatchRow {
  public readonly match = input.required<MatchRowView>();

  protected readonly fact = computed(() => this.match().digest.facts[0] ?? null);
  protected readonly toneText = TONE_TEXT;
}
