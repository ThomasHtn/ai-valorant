import { Component, computed, input } from '@angular/core';

import { Tone } from '@core/common/enums.model';
import { HelpTopic } from '@core/help/stat-help.constants';
import { RATING_TEXT_CLASS } from '@core/rating/rating.constants';
import { Rating } from '@core/rating/rating.model';
import { InfoTip } from '@shared/info-tip/info-tip';

/**
 * One figure of a stats band (`STAT_BAND_CLASS`): its name, then the value in the display face
 * coloured by its rating, then the change or reference on a line of its own.
 */
@Component({
  selector: 'app-stat-tile',
  imports: [InfoTip],
  template: `
    <p class="flex items-center gap-1 text-[0.8125rem] leading-tight font-medium text-text-muted">
      <span class="truncate">{{ label() }}</span>
      @if (help()) {
        <app-info-tip [topic]="help()" />
      }
    </p>
    <p
      class="mt-1.5 font-display text-2xl leading-none font-semibold whitespace-nowrap tabular-nums"
      [class]="valueClass()"
    >
      {{ value() }}
    </p>
    @if (detail()) {
      <p class="mt-1 truncate text-[0.8125rem] leading-tight text-text-muted">
        <span
          [class.good]="tone() === 'good'"
          [class.bad]="tone() === 'bad'"
          [class.muted]="tone() === 'neutral'"
          >{{ detail() }}</span
        >
        @if (context()) {
          {{ context() }}
        }
      </p>
    }
  `,
  host: { class: 'block min-w-0 px-4 py-3 shadow-[1px_1px_0_0_var(--color-edge)]' },
})
export class StatTile {
  public readonly label = input.required<string>();
  public readonly value = input.required<string>();
  /** Line under the value: a change, a reference. */
  public readonly detail = input<string | null>(null);
  /** Muted words after the detail, saying what it is measured against ('vs septembre'). */
  public readonly context = input<string | null>(null);
  public readonly tone = input<Tone>('neutral');
  /** How the value reads (green, amber, red); left neutral for figures that are only reported. */
  public readonly rating = input<Rating>('unknown');
  /** Explanation behind an "i" icon next to the label. */
  public readonly help = input<HelpTopic | null>(null);

  protected readonly valueClass = computed(() => RATING_TEXT_CLASS[this.rating()]);
}
