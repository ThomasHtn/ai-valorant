import { Component, computed, input } from '@angular/core';

import { Reference } from '@core/common/enums.model';
import { REFERENCE_SHORT_LABELS } from '@core/format/labels.constants';
import { HeadlineStat, OpeningDuels } from '@core/report/players.model';
import { BetterHint } from '@shared/better-hint/better-hint';
import { InfoTip } from '@shared/info-tip/info-tip';
import { TONE_TEXT_CLASSES } from '@shared/stat-tile/stat-tile.constants';

import { profileRows } from '../players.utils';

/**
 * The figures behind the player's radar, one line each in the radar's order: value coloured against
 * the reference, the reference itself and the sample. The radar shows the shape, this list the numbers.
 */
@Component({
  selector: 'app-profile-figures',
  imports: [BetterHint, InfoTip],
  template: `
    <table class="hover-rows w-full border-separate border-spacing-y-0.5 tabular-nums">
      <thead>
        <tr class="text-sm text-text-secondary">
          <th scope="col" class="px-2.5 py-1.5 text-left font-semibold">Chiffre</th>
          <th scope="col" class="px-2.5 py-1.5 text-right font-semibold">Joueur</th>
          <th scope="col" class="px-2.5 py-1.5 text-right font-semibold">{{ referenceLabel() }}</th>
          <th scope="col" class="px-2.5 py-1.5 text-right font-semibold">Sur</th>
        </tr>
      </thead>
      <tbody>
        @for (row of rows(); track row.key) {
          <tr>
            <th scope="row" class="bg-text-primary/4 px-2.5 py-1.5 text-left font-medium">
              <span class="inline-flex items-center gap-1"
                >{{ row.label
                }}<app-better-hint [better]="row.better" [compact]="true" /><app-info-tip
                  [topic]="row.help"
              /></span>
            </th>
            <td
              class="bg-text-primary/4 px-2.5 py-1.5 text-right font-display text-[1.2rem] font-semibold"
              [class]="row.tone ? toneText[row.tone] : 'text-text-primary'"
            >
              {{ row.value }}
            </td>
            <td class="bg-text-primary/4 px-2.5 py-1.5 text-right text-text-secondary">
              {{ row.reference }}
            </td>
            <td
              class="bg-text-primary/4 px-2.5 py-1.5 text-right text-sm whitespace-nowrap text-text-muted"
            >
              {{ row.sample ?? '—' }}
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
  host: { class: 'block min-w-0 overflow-x-auto' },
})
export class ProfileFigures {
  public readonly headline = input.required<HeadlineStat[]>();
  public readonly openingDuels = input.required<OpeningDuels>();
  public readonly reference = input.required<Reference>();
  public readonly colours = input(true);

  protected readonly toneText = TONE_TEXT_CLASSES;
  protected readonly referenceLabel = computed(() => REFERENCE_SHORT_LABELS[this.reference()]);
  protected readonly rows = computed(() =>
    profileRows(this.headline(), this.openingDuels(), this.reference(), this.colours()),
  );
}
