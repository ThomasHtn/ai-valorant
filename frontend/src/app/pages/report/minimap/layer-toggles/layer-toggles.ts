import { Component, input, output } from '@angular/core';

import { InfoTip } from '@shared/info-tip/info-tip';

import { MINIMAP_LAYERS } from '../minimap-layers.constants';
import { MinimapLayerKey } from '../minimap-layers.model';
import { LayerSymbol } from './layer-symbol';

/** One checkbox per layer with its symbol, its "i" and its number of points. */
@Component({
  selector: 'app-layer-toggles',
  imports: [InfoTip, LayerSymbol],
  template: `
    @for (layer of layers; track layer.key) {
      @let on = active().has(layer.key);
      <label
        class="flex cursor-pointer items-center gap-2 bg-text-primary/4 px-2.5 py-1.5 transition-colors hover:bg-text-primary/7"
        [class]="on ? 'text-text-primary' : 'text-text-secondary'"
      >
        <input
          type="checkbox"
          class="size-4 accent-brand-500"
          [id]="'layer-' + layer.key"
          [checked]="on"
          (change)="toggle.emit(layer.key)"
        />
        <app-layer-symbol [shape]="layer.shape" [color]="layer.color" />
        <span>{{ layer.label }}</span>
        <app-info-tip [topic]="layer.help" />
        <span class="ml-auto text-[0.9rem] text-text-muted">{{ counts()[layer.key] }}</span>
      </label>
    }
  `,
  host: { class: 'flex flex-wrap gap-0.5 lg:flex-col', role: 'group', 'aria-label': 'Calques' },
})
export class LayerToggles {
  public readonly active = input.required<ReadonlySet<MinimapLayerKey>>();
  public readonly counts = input.required<Record<MinimapLayerKey, number>>();
  public readonly toggle = output<MinimapLayerKey>();

  protected readonly layers = MINIMAP_LAYERS;
}
