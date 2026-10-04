import { Component, input, output } from '@angular/core';

import { InfoTip } from '@shared/info-tip/info-tip';

import { MinimapLayer, MinimapLayerKey } from '../minimap-layers.model';
import { LayerSymbol } from './layer-symbol';

/** One checkbox per layer of the side with its symbol and its "i", in one row; the count shows on hover. */
@Component({
  selector: 'app-layer-toggles',
  imports: [InfoTip, LayerSymbol],
  template: `
    @for (layer of layers(); track layer.key) {
      @let on = active().has(layer.key);
      <label
        class="flex cursor-pointer items-center gap-1.5 bg-text-primary/4 px-2 py-1 text-sm transition-colors hover:bg-text-primary/10"
        [class]="on ? 'text-text-primary' : 'text-text-secondary'"
        [title]="layer.label + ' : ' + counts()[layer.key] + ' sur la carte'"
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
      </label>
    }
  `,
  host: { class: 'flex flex-wrap gap-0.5', role: 'group', 'aria-label': 'Calques' },
})
export class LayerToggles {
  public readonly layers = input.required<readonly MinimapLayer[]>();
  public readonly active = input.required<ReadonlySet<MinimapLayerKey>>();
  public readonly counts = input.required<Record<MinimapLayerKey, number>>();
  public readonly toggle = output<MinimapLayerKey>();
}
