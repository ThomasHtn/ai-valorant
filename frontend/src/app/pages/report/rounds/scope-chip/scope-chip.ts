import { Component, input, output } from '@angular/core';
import { LucideX } from '@lucide/angular';

/** A filter brought from another view (a match, a table cell), with a button to drop it. */
@Component({
  selector: 'app-scope-chip',
  imports: [LucideX],
  template: `
    <span>{{ label() }}</span>
    <button
      type="button"
      class="focus-ring ml-auto cursor-pointer p-1 text-text-secondary hover:text-text-primary"
      aria-label="Retirer ce filtre"
      (click)="cleared.emit()"
    >
      <svg class="size-4" lucideX aria-hidden="true"></svg>
    </button>
  `,
  host: {
    class: 'flex h-9 items-center gap-2 border-l-2 border-brand-500 bg-brand-500/10 pl-2.5 pr-1',
  },
})
export class ScopeChip {
  public readonly label = input.required<string>();
  public readonly cleared = output();
}
