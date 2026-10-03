import { Component, computed, input } from '@angular/core';
import { LucideTriangleAlert } from '@lucide/angular';

import { integer } from '@core/format/value-format.utils';
import { ReportMeta } from '@core/report/report-meta.model';

/** One fact of the quality line; `warn` ones are amber with a warning sign. */
interface QualityFact {
  text: string;
  warn: boolean;
}

/**
 * What the figures of the report rest on, beside the period's own facts in the report header:
 * excluded matches, patches, top ranked base, lineups, maps without a reference.
 */
@Component({
  selector: 'app-data-quality',
  imports: [LucideTriangleAlert],
  template: `
    @for (fact of facts(); track fact.text) {
      <span class="inline-flex items-center gap-1.5" [class.text-rating-average]="fact.warn">
        @if (fact.warn) {
          <svg class="size-3.5 shrink-0" lucideTriangleAlert aria-hidden="true"></svg>
        }
        {{ fact.text }}
      </span>
    }
  `,
  host: { class: 'flex flex-wrap gap-x-5 gap-y-1 text-sm text-text-muted' },
})
export class DataQuality {
  public readonly meta = input.required<ReportMeta>();

  protected readonly facts = computed<QualityFact[]>(() => {
    const { patches, quality } = this.meta();
    const facts: QualityFact[] = [];
    if (quality.incompleteMatches) {
      facts.push({ text: `${quality.incompleteMatches} matchs incomplets exclus`, warn: true });
    }
    facts.push(
      patches.length > 1
        ? {
            text: `Patchs ${patches.map((p) => `${p.patch} (${p.matches} matchs)`).join(', ')}`,
            warn: true,
          }
        : { text: `Patch ${patches.map((p) => p.patch).join('')}`, warn: false },
      {
        text: `Top ranked : ${integer(quality.topMatches)} matchs du patch ${quality.topPatches.join(', ')}`,
        warn: false,
      },
      { text: `${quality.lineups} lineups`, warn: false },
    );
    if (quality.mapsWithoutTop.length) {
      facts.push({
        text: `Sans référence top ranked : ${quality.mapsWithoutTop.join(', ')}`,
        warn: true,
      });
    }
    return facts;
  });
}
