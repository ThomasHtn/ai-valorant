import { Component, computed, input } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

import { BadgeKind } from '@core/common/badge.model';
import { MapThumb } from '@shared/game-art/map-thumb';

import { BADGE_SIZES, BADGE_STYLES, MAP_TAG_CLASS } from './badge.constants';
import { BadgeSize } from './badge.model';

/**
 * A rounded pill naming a scope (side, player), a status or a result, with its icon. A map is not a
 * pill: it reads as its square preview then its name, as in ValoQuests.
 */
@Component({
  selector: 'app-badge',
  imports: [LucideDynamicIcon, MapThumb],
  template: `
    @if (kind() === 'map') {
      <app-map-thumb [map]="label()" />
    } @else if (style().icon; as icon) {
      <svg [class]="iconClass()" [lucideIcon]="icon" aria-hidden="true"></svg>
    }
    {{ label() }}
  `,
  host: {
    class: 'inline-flex items-center leading-5 font-semibold whitespace-nowrap',
    '[class]': 'hostClass()',
  },
})
export class Badge {
  public readonly label = input.required<string>();
  public readonly kind = input<BadgeKind>('neutral');
  public readonly size = input<BadgeSize>('md');

  protected readonly style = computed(() => BADGE_STYLES[this.kind()]);
  protected readonly sizes = computed(() => BADGE_SIZES[this.size()]);
  /** A string, because the icon component takes `class` as an input. */
  protected readonly iconClass = computed(
    () => `shrink-0 ${this.sizes().icon} ${this.style().iconTint ?? ''}`,
  );
  protected readonly hostClass = computed(() =>
    this.kind() === 'map'
      ? MAP_TAG_CLASS
      : `rounded-full ring-1 ring-inset ${this.style().tint} ${this.sizes().pill}`,
  );
}
