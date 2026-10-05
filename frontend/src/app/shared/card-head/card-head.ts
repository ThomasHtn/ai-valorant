import { Component, input } from '@angular/core';

/**
 * Head of a dashboard card: an amber icon (projected first), the title and one line saying what the
 * card answers; anything projected with `slot="aside"` (a badge, a legend, a link) sits on the right.
 */
@Component({
  selector: 'app-card-head',
  template: `
    <div class="min-w-0">
      <h2
        class="!m-0 flex items-center gap-2.5 text-lg font-semibold after:!hidden"
        [id]="headingId()"
      >
        <span
          class="grid size-[1.125rem] shrink-0 place-items-center text-brand-500 [&>svg]:size-[1.125rem]"
          aria-hidden="true"
          ><ng-content
        /></span>
        {{ title() }}
      </h2>
      @if (desc()) {
        <p class="mt-0.5 mb-0 text-xs text-text-muted">{{ desc() }}</p>
      }
    </div>
    <ng-content select="[slot=aside]" />
  `,
  host: { class: 'flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5' },
})
export class CardHead {
  public readonly title = input.required<string>();
  public readonly desc = input<string | null>(null);
  /** Id of the heading, for the card's `aria-labelledby`. */
  public readonly headingId = input<string | null>(null);
}
