import {
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
  untracked,
} from '@angular/core';

import { Side } from '@core/common/enums.model';
import { SIDE_LABELS } from '@core/format/labels.constants';
import { resourceValue } from '@core/http/resource-state.utils';
import { ReportApi } from '@core/report/report-api';
import { ReportContext } from '@core/report/report-context';
import { ViewState } from '@core/report/view-state';
import { provideViewState } from '@core/report/view-states';
import { MinimapCanvas } from '@shared/minimap-canvas/minimap-canvas';
import { MinimapHighlight } from '@shared/minimap-canvas/minimap-canvas.model';
import { ResourceState } from '@shared/resource-state/resource-state';

import { LayerToggles } from './layer-toggles/layer-toggles';
import { MapPicker } from './map-picker/map-picker';
import { DEFAULT_LAYERS } from './minimap-layers.constants';
import { MinimapLayerKey } from './minimap-layers.model';
import {
  layerCounts,
  minimapMarkers,
  pickMap,
  plantSpots,
  sideLayers,
  zoneLines,
  zoneVerdict,
} from './minimap.utils';
import { ZoneTable } from './zone-table/zone-table';

/**
 * Minimap: the squad's deaths, kills and plants of the period on the real minimap of one map and
 * side, by layer, the top ranked plants as density spots, with a zone summary compared with the top ranked. A point opens its round.
 */
@Component({
  selector: 'app-minimap-view',
  imports: [LayerToggles, MapPicker, MinimapCanvas, ResourceState, ZoneTable],
  host: { class: 'view-body' },
  providers: [provideViewState('minimap')],
  templateUrl: './minimap-view.html',
})
export class MinimapView {
  /** Route parameter: the map, any case ('split'). */
  public readonly map = input<string>();
  /** Query parameters of a deep link (Points forts et faibles): 'att' or 'def', and a squad player. */
  public readonly sideParam = input<string | undefined>(undefined, { alias: 'side' });
  public readonly playerParam = input<string | undefined>(undefined, { alias: 'player' });

  protected readonly context = inject(ReportContext);
  protected readonly state = inject(ViewState);
  private readonly api = inject(ReportApi);

  protected readonly side = linkedSignal<Side>(() => (this.sideParam() === 'def' ? 'def' : 'att'));
  protected readonly layers = signal<ReadonlySet<MinimapLayerKey>>(DEFAULT_LAYERS);
  /** Zone hovered in the table, circled on the map. */
  private readonly hoveredZone = signal<string | null>(null);

  protected readonly maps = computed(() => resourceValue(this.context.meta, null)?.maps ?? []);
  protected readonly players = computed(
    () => resourceValue(this.context.meta, null)?.players.map((p) => p.name) ?? [],
  );
  protected readonly mapName = computed(() => pickMap(this.map(), this.maps()));
  protected readonly view = this.api.minimap(this.context.query, this.mapName);

  private readonly data = computed(() => resourceValue(this.view, null));
  protected readonly sideData = computed(() => this.data()?.sides[this.side()]);
  protected readonly counts = computed(() => layerCounts(this.sideData(), this.data()?.topPlants));
  protected readonly visibleLayers = computed(() => sideLayers(this.side()));
  protected readonly markers = computed(() => {
    const data = this.data();
    return data
      ? minimapMarkers(data, this.side(), this.layers(), this.state.filters().player)
      : [];
  });
  protected readonly density = computed(() =>
    plantSpots(this.data()?.topPlants ?? [], this.layers()),
  );
  protected readonly zones = computed(() => this.sideData()?.zones ?? null);
  /** The sentence the view opens on: zones where the squad dies first well above the top ranked. */
  protected readonly verdict = computed(() => {
    const zones = this.zones();
    return zones
      ? zoneVerdict(zoneLines(zones.rows, zones.firstDeaths), zones.firstDeaths, this.sideLabel())
      : null;
  });
  protected readonly highlight = computed<MinimapHighlight | null>(() => {
    const zone = this.hoveredZone();
    const callout = zone ? this.data()?.callouts.find((c) => c.name === zone) : undefined;
    return callout ? { x: callout.x, y: callout.y } : null;
  });
  protected readonly sideLabel = computed(() => SIDE_LABELS[this.side()].toLowerCase());
  protected readonly sides: readonly Side[] = ['att', 'def'];
  protected readonly sideLabels = SIDE_LABELS;

  constructor() {
    // A linked player becomes the player filter once; the select changes it afterwards.
    effect(() => {
      const player = this.playerParam();
      if (player) {
        untracked(() => this.state.setFilter('player', player));
      }
    });
  }

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
