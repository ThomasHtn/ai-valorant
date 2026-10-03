import { Component, computed, input } from '@angular/core';
import { LucideTriangleAlert } from '@lucide/angular';

import { integer } from '@core/format/value-format.utils';
import { ReportMeta } from '@core/report/report-meta.model';

/** One fact of the quality line; `warn` ones are amber with a warning sign. */
interface QualityFact {
  text: string;
  warn: boolean;
}

/** What the figures of the report rest on: matches, patches, top ranked base, gaps in the references. */
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
  host: { class: 'flex flex-wrap gap-x-5 gap-y-1 text-[0.92rem] text-text-secondary' },
})
export class DataQuality {
  public readonly meta = input.required<ReportMeta>();

  protected readonly facts = computed<QualityFact[]>(() => {
    const { matches, rounds, patches, quality } = this.meta();
    const facts: QualityFact[] = [
      {
        text: quality.incompleteMatches
          ? `${matches} matchs, ${integer(rounds)} rounds, ${quality.incompleteMatches} incomplets exclus`
          : `${matches} matchs, ${integer(rounds)} rounds, tous complets`,
        warn: quality.incompleteMatches > 0,
      },
      {
        text: `Patchs : ${patches.map((p) => `${p.patch} (${p.matches} matchs)`).join(', ')}`,
        warn: patches.length > 1,
      },
      {
        text: `Top ranked : ${integer(quality.topMatches)} matchs du patch ${quality.topPatches.join(', ')}`,
        warn: false,
      },
      { text: `${quality.lineups} lineups différentes`, warn: false },
    ];
    if (quality.mapsWithoutTop.length) {
      facts.push({
        text: `Sans référence top ranked : ${quality.mapsWithoutTop.join(', ')}`,
        warn: true,
      });
    }
    return facts;
  });
}
