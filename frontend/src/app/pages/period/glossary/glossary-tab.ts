import { KeyValuePipe } from '@angular/common';
import { Component, inject } from '@angular/core';

import { STAT_HELP_GROUPS } from '@core/help/stat-help.constants';
import { ReferenceApi } from '@core/reference/reference-api';
import { ResourceState } from '@shared/resource-state/resource-state';

/** Game jargon from the API, then the same stat explanations as the info tips. */
@Component({
  selector: 'app-glossary-tab',
  imports: [ResourceState, KeyValuePipe],
  template: `
    <h2 class="!mt-0">Vocabulaire</h2>
    <app-resource-state [resource]="glossary">
      <dl class="grid gap-x-6 gap-y-2 sm:grid-cols-[max-content_1fr]">
        @for (entry of glossary.value()?.terms ?? []; track entry.term) {
          <dt class="font-semibold">{{ entry.term }}</dt>
          <dd class="text-text-secondary">{{ entry.definition }}</dd>
        }
      </dl>
    </app-resource-state>

    @for (group of groups; track group.title) {
      <h2>{{ group.title }}</h2>
      <dl class="grid gap-x-6 gap-y-3 sm:grid-cols-[minmax(10rem,max-content)_1fr]">
        @for (item of group.entries | keyvalue: keepOrder; track item.key) {
          @let help = item.value;
          <dt class="font-semibold">{{ help.title }}</dt>
          <dd class="max-w-[68ch] text-text-secondary">
            <span class="text-text-primary">{{ help.what }}</span>
            @if (help.how) {
              {{ help.how }}
            }
            @if (help.example) {
              {{ help.example.text }}
            }
            @if (help.read) {
              <span class="mt-0.5 block text-sm text-text-muted">{{ help.read }}</span>
            }
          </dd>
        }
      </dl>
    }
  `,
})
export class GlossaryTab {
  protected readonly glossary = inject(ReferenceApi).glossary;
  protected readonly groups = STAT_HELP_GROUPS;

  /** Keeps the order the explanations are written in instead of sorting them by key. */
  protected keepOrder(): number {
    return 0;
  }
}
