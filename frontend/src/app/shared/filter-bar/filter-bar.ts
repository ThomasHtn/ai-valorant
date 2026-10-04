import { Component, inject, input } from '@angular/core';

import { Side } from '@core/common/enums.model';
import { ViewState } from '@core/report/view-state';
import { MapSelect } from '@shared/map-select/map-select';

import { SIDE_OPTIONS } from './filter-bar.constants';

/**
 * Scope filters of a report view: map, side, player, plus the view's own controls. Reads and writes
 * the view's `ViewState`, so a filter never reaches another view; each `show*` input hides a control
 * the view does not use.
 */
@Component({
  selector: 'app-filter-bar',
  imports: [MapSelect],
  templateUrl: './filter-bar.html',
  host: { class: 'block' },
})
export class FilterBar {
  /** Maps of the period, alphabetical. */
  public readonly maps = input<string[]>([]);
  /** Squad players of the period, alphabetical. */
  public readonly players = input<string[]>([]);
  public readonly showMap = input(true);
  public readonly showSide = input(true);
  public readonly showPlayer = input(true);

  protected readonly state = inject(ViewState);
  protected readonly sideOptions = SIDE_OPTIONS;

  protected setSide(event: Event): void {
    this.state.setFilter('side', (event.target as HTMLSelectElement).value as Side | '');
  }

  protected setPlayer(event: Event): void {
    this.state.setFilter('player', (event.target as HTMLSelectElement).value);
  }
}
