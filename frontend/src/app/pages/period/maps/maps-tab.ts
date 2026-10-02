import { Component, computed, inject, input, signal } from '@angular/core';

import { resourceValue } from '@core/http/resource-state.utils';
import { PeriodsApi } from '@core/periods/periods-api';
import { ResourceState } from '@shared/resource-state/resource-state';
import { mapBanner } from '@core/game-assets/game-assets.utils';
import { PickerTabs } from '@shared/tabs/picker-tabs';
import { PickerItem } from '@shared/tabs/tabs.model';

import { PeriodContext } from '@core/periods/period-context';
import { MapSheetView } from './map-sheet/map-sheet';
import { DEFAULT_MAP_SECTION } from './map-sheet/map-sheet.constants';

/** Maps tab: one banner per map played, most played first; the first one opens by default. */
@Component({
  selector: 'app-maps-tab',
  imports: [PickerTabs, ResourceState, MapSheetView],
  templateUrl: './maps-tab.html',
})
export class MapsTab {
  /** Route parameter (`/periods/maps/:map`). */
  public readonly map = input<string>();

  private readonly context = inject(PeriodContext);

  protected readonly maps = computed(() => resourceValue(this.context.overview, null)?.maps ?? []);
  protected readonly selected = computed(() => this.map() ?? this.maps()[0] ?? null);
  protected readonly sheet = inject(PeriodsApi).map(this.context.query, this.selected);

  protected readonly tabs = computed<PickerItem[]>(() =>
    this.maps().map((name) => ({
      id: name,
      label: name,
      image: mapBanner(name),
      link: ['/periods/maps', name],
    })),
  );

  /** Open part of the sheet, kept when moving to another map. */
  protected readonly section = signal(DEFAULT_MAP_SECTION);
}
