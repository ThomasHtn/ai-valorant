import { Component, input, output } from '@angular/core';

/**
 * The "Carte" drop-down shared by every view's filter row. With `allowAll`, an empty choice
 * ("Toutes") keeps every map; without it (Minimap) one map is always picked.
 */
@Component({
  selector: 'app-map-select',
  template: `
    <span class="filter-label">Carte</span>
    <!-- [selected] on options, not [value] on the select: options can arrive after the value. -->
    <select class="field-control min-w-28" (change)="pick($event)">
      @if (allowAll()) {
        <option value="" [selected]="!selected()">Toutes</option>
      }
      @for (map of maps(); track map) {
        <option [value]="map" [selected]="selected() === map">{{ map }}</option>
      }
    </select>
  `,
  host: { class: 'flex min-w-0 items-center gap-2', role: 'group', 'aria-label': 'Carte' },
})
export class MapSelect {
  public readonly maps = input.required<readonly string[]>();
  /** The map shown; null or '' for every map. */
  public readonly selected = input<string | null | undefined>(null);
  public readonly allowAll = input(true);
  /** The map picked, '' for every map. */
  public readonly selectedChange = output<string>();

  protected pick(event: Event): void {
    this.selectedChange.emit((event.target as HTMLSelectElement).value);
  }
}
