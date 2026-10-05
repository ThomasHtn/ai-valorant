import { Component, input } from '@angular/core';

/**
 * Head of a block in the main tabs: an amber icon (projected), the title in the display face, and
 * one line saying what the block answers, so each block reads as the next step of the page.
 */
@Component({
  selector: 'app-section-head',
  template: `
    <h2
      class="!m-0 flex items-center gap-2.5 font-display text-xl leading-tight font-semibold tracking-[0.03em] uppercase after:!hidden"
      [id]="headingId()"
    >
      <span
        class="grid size-5 shrink-0 place-items-center text-brand-500 [&>svg]:size-5"
        aria-hidden="true"
        ><ng-content
      /></span>
      {{ title() }}
    </h2>
    @if (desc()) {
      <p class="my-0 text-text-muted sm:ml-auto sm:text-right">{{ desc() }}</p>
    }
  `,
  host: {
    class: 'flex flex-col gap-1 border-b border-edge pb-2 sm:flex-row sm:items-end sm:gap-6',
  },
})
export class SectionHead {
  public readonly title = input.required<string>();
  public readonly desc = input<string | null>(null);
  /** Id of the heading, for the section's `aria-labelledby`. */
  public readonly headingId = input<string | null>(null);
}
