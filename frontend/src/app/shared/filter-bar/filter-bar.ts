import { Component, inject, input } from '@angular/core';

import { Reference, Side } from '@core/common/enums.model';
import { ReportState } from '@core/report/report-state';
import { DisplayToggles } from '@shared/display-toggles/display-toggles';
import { InfoTip } from '@shared/info-tip/info-tip';

import { REFERENCE_OPTIONS, SIDE_OPTIONS } from './filter-bar.constants';

/**
 * Filters shared by every report view: map, side, player, the reference cells are compared with,
 * and the display toggles. Reads and writes `ReportState`; each `show*` input hides a control the
 * view does not use.
 */
@Component({
  selector: 'app-filter-bar',
  imports: [DisplayToggles, InfoTip],
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
  public readonly showReference = input(true);
  public readonly showToggles = input(true);

  protected readonly state = inject(ReportState);
  protected readonly referenceOptions = REFERENCE_OPTIONS;
  protected readonly sideOptions = SIDE_OPTIONS;

  protected setMap(event: Event): void {
    this.state.setFilter('map', (event.target as HTMLSelectElement).value);
  }

  protected setSide(event: Event): void {
    this.state.setFilter('side', (event.target as HTMLSelectElement).value as Side | '');
  }

  protected setPlayer(event: Event): void {
    this.state.setFilter('player', (event.target as HTMLSelectElement).value);
  }

  protected setReference(reference: Reference): void {
    this.state.setReference(reference);
  }
}
