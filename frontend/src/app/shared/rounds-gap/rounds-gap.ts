import { Component, computed, input } from '@angular/core';

import { matchesText, roundsGapText } from './rounds-gap.utils';

/**
 * Rounds a finding costs or brings, in words: '11 rounds perdus' coloured, 'sur 5 matchs' under it.
 * Plain text, no box: the colour of the count is enough to rank it.
 */
@Component({
  selector: 'app-rounds-gap',
  template: `
    <span class="whitespace-nowrap" [class]="toneClass()">
      <b class="font-display text-xl leading-none font-semibold tabular-nums">{{ text().count }}</b>
      {{ text().words }}
    </span>
    @if (matches(); as matches) {
      <span class="text-sm whitespace-nowrap text-text-muted">{{ matchesLine() }}</span>
    }
  `,
  host: { class: 'inline-flex shrink-0 flex-col items-end gap-0.5 text-right leading-tight' },
})
export class RoundsGap {
  /** Rounds won (+) or lost (-) against the reference on the same sample. */
  public readonly gap = input.required<number>();
  /** Distinct matches behind it; null leaves the second line out. */
  public readonly matches = input<number | null>(null);

  protected readonly text = computed(() => roundsGapText(this.gap()));
  protected readonly matchesLine = computed(() => matchesText(this.matches() ?? 0));
  protected readonly toneClass = computed(() =>
    this.gap() < 0 ? 'text-rating-bad' : 'text-rating-good',
  );
}
