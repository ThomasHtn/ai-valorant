import { Component, computed, inject, input, signal } from '@angular/core';

import { Side } from '@core/common/enums.model';
import { SIDE_LABELS } from '@core/format/labels.constants';
import { resourceValue } from '@core/http/resource-state.utils';
import { ReportApi } from '@core/report/report-api';
import { ReportContext } from '@core/report/report-context';
import { ReportState } from '@core/report/report-state';
import { MinimapCanvas } from '@shared/minimap-canvas/minimap-canvas';
import { MinimapHighlight } from '@shared/minimap-canvas/minimap-canvas.model';
import { ResourceState } from '@shared/resource-state/resource-state';

import { LayerToggles } from './layer-toggles/layer-toggles';
import { MapPicker } from './map-picker/map-picker';
import { DEFAULT_LAYERS } from './minimap-layers.constants';
import { MinimapLayerKey } from './minimap-layers.model';
import { layerCounts, minimapMarkers, pickMap } from './minimap.utils';
import { ZoneTable } from './zone-table/zone-table';

/**
 * Minimap: the squad's deaths, kills and plants of the period on the real minimap of one map and
 * side, by layer, with a zone summary compared with the top ranked. A point opens its round.
 */
@Component({
  selector: 'app-minimap-view',
  imports: [LayerToggles, MapPicker, MinimapCanvas, ResourceState, ZoneTable],
  templateUrl: './minimap-view.html',
})
export class MinimapView {
  /** Route parameter: the map, any case ('split'). */
  public readonly map = input<string>();

  protected readonly context = inject(ReportContext);
  protected readonly state = inject(ReportState);
  private readonly api = inject(ReportApi);

  protected readonly side = signal<Side>('att');
  protected readonly layers = signal<ReadonlySet<MinimapLayerKey>>(DEFAULT_LAYERS);
  /** Zone hovered in the table, circled on the map. */
  private readonly hoveredZone = signal<string | null>(null);

  protected readonly maps = computed(() => resourceValue(this.context.meta, null)?.maps ?? []);
  protected readonly players = computed(
    () => resourceValue(this.context.meta, null)?.players.map((p) => p.name) ?? [],
  );
  protected readonly mapName = computed(() =>
    pickMap(this.map(), this.state.filters().map, this.maps()),
  );
  protected readonly view = this.api.minimap(this.context.query, this.mapName);

  private readonly data = computed(() => resourceValue(this.view, null));
  protected readonly sideData = computed(() => this.data()?.sides[this.side()]);
  protected readonly counts = computed(() => layerCounts(this.sideData()));
  protected readonly markers = computed(() => {
    const data = this.data();
    return data
      ? minimapMarkers(data, this.side(), this.layers(), this.state.filters().player)
      : [];
  });
  protected readonly zones = computed(() => this.sideData()?.zones ?? null);
  protected readonly highlight = computed<MinimapHighlight | null>(() => {
    const zone = this.hoveredZone();
    const callout = zone ? this.data()?.callouts.find((c) => c.name === zone) : undefined;
    return callout ? { x: callout.x, y: callout.y } : null;
  });
  protected readonly sideLabel = computed(() => SIDE_LABELS[this.side()].toLowerCase());
  protected readonly sides: readonly Side[] = ['att', 'def'];
  protected readonly sideLabels = SIDE_LABELS;

  protected toggleLayer(key: MinimapLayerKey): void {
    this.layers.update((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  protected setPlayer(event: Event): void {
    this.state.setFilter('player', (event.target as HTMLSelectElement).value);
  }

  protected setHighlight(zone: string | null): void {
    this.hoveredZone.set(zone);
  }
}
