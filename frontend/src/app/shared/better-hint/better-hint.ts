import { Component, computed, input } from '@angular/core';
import { LucideArrowDown, LucideArrowUp } from '@lucide/angular';

import { BETTER_LABELS } from './better-hint.constants';

/**
 * Which way a figure is better: an arrow, with "Plus haut = mieux" written beside it unless `compact`
 * (table headers keep the arrow only, the words in its tooltip). Nothing for a neutral figure.
 */
@Component({
  selector: 'app-better-hint',
  imports: [LucideArrowUp, LucideArrowDown],
  template: `
    @if (label(); as text) {
      @if (better() > 0) {
        <svg lucideArrowUp class="size-3.5 shrink-0" aria-hidden="true"></svg>
      } @else {
        <svg lucideArrowDown class="size-3.5 shrink-0" aria-hidden="true"></svg>
      }
      @if (compact()) {
        <span class="sr-only">{{ text }}</span>
      } @else {
        <span>{{ text }}</span>
      }
    }
  `,
  host: {
    class: 'inline-flex items-center gap-1 align-middle text-sm font-normal text-text-muted',
    '[attr.title]': 'label()',
  },
})
export class BetterHint {
  /** 1 higher is better, -1 lower is better, 0 neutral. */
  public readonly better = input.required<number>();
  public readonly compact = input(false);

  protected readonly label = computed(() => {
    const better = this.better();
    return better > 0 ? BETTER_LABELS[1] : better < 0 ? BETTER_LABELS[-1] : null;
  });
}
