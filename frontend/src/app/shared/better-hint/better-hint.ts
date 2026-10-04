import { Component, computed, input } from '@angular/core';
import { LucideArrowDown, LucideArrowUp } from '@lucide/angular';

import { HoverTip } from '@shared/hover-tip/hover-tip';
import { HoverTipContent } from '@shared/hover-tip/hover-tip.model';

import { BETTER_LABELS, BETTER_SENTENCES } from './better-hint.constants';

/**
 * Which way a figure is better: a green arrow pointing to the good side, with "Plus haut = mieux"
 * written beside it unless `compact` (table headers). Hovering it says what it means. Nothing for a
 * neutral figure.
 */
@Component({
  selector: 'app-better-hint',
  imports: [HoverTip, LucideArrowUp, LucideArrowDown],
  template: `
    @if (label(); as text) {
      <span
        class="focus-ring inline-flex cursor-help items-center gap-1"
        [attr.tabindex]="compact() ? 0 : null"
        [appHoverTip]="tip()"
      >
        @if (better() > 0) {
          <svg lucideArrowUp class="size-4 shrink-0 text-rating-good" aria-hidden="true"></svg>
        } @else {
          <svg lucideArrowDown class="size-4 shrink-0 text-rating-good" aria-hidden="true"></svg>
        }
        @if (compact()) {
          <span class="sr-only">{{ text }}</span>
        } @else {
          <span>{{ text }}</span>
        }
      </span>
    }
  `,
  host: { class: 'inline-flex items-center align-middle text-sm font-normal text-text-muted' },
})
export class BetterHint {
  /** 1 higher is better, -1 lower is better, 0 neutral. */
  public readonly better = input.required<number>();
  public readonly compact = input(false);

  protected readonly label = computed(() => {
    const better = this.better();
    return better > 0 ? BETTER_LABELS[1] : better < 0 ? BETTER_LABELS[-1] : null;
  });
  protected readonly tip = computed<HoverTipContent | null>(() => {
    const better = this.better();
    if (!better) {
      return null;
    }
    const key = better > 0 ? 1 : -1;
    return { title: BETTER_LABELS[key], text: BETTER_SENTENCES[key] };
  });
}
