import { Component, computed, inject, input } from '@angular/core';

import { percent } from '@core/format/format.utils';
import { resourceValue } from '@core/http/resource-state.utils';
import { scopeBadges } from '@core/periods/finding-format.utils';
import { SummaryItem } from '@core/periods/findings.model';
import { PeriodContext } from '@core/periods/period-context';
import { Badge } from '@shared/badge/badge';
import { MapThumb } from '@shared/game-art/map-thumb';

/** "À retenir": the main weaknesses, strengths and the worst first-death spot, one per row. */
@Component({
  selector: 'app-summary-box',
  imports: [Badge, MapThumb],
  templateUrl: './summary-box.html',
  host: { class: 'block rounded-r-md border-l-2 border-brand-500 bg-text-primary/4 px-4 py-1' },
})
export class SummaryBox {
  public readonly items = input.required<SummaryItem[]>();

  private readonly overview = inject(PeriodContext).overview;

  /** Map apart from the other scope badges (side, player), figure and reference, prepared once. */
  protected readonly rows = computed(() => {
    const players = (resourceValue(this.overview, null)?.players ?? []).map((p) => p.name);
    return this.items().map((item) => {
      const badges = scopeBadges(item.scope, 'team', players);
      return {
        map: badges.find((b) => b.kind === 'map')?.label ?? null,
        badges: badges.filter((b) => b.kind !== 'map'),
        label: item.label,
        tone: item.tone,
        value: item.squad ? percent(item.squad) : null,
        reference: item.reference ? `adversaires ${percent(item.reference)}` : null,
      };
    });
  });
}
