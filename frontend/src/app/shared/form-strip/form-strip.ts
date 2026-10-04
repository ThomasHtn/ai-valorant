import { Component, computed, input } from '@angular/core';

import { FormMatch } from '@core/report/period-form.model';
import { HoverTip } from '@shared/hover-tip/hover-tip';

import { formBars } from './form-strip.utils';

/**
 * Form of a period as a sparkline: one bar per match in play order, up and green for a win, down
 * and red for a loss, taller as the round margin grows. Bars are tracked by identity so a new period
 * redraws them all and they grow again from the axis.
 */
@Component({
  selector: 'app-form-strip',
  imports: [HoverTip],
  template: `
    <span class="form-strip" [class.form-strip-sm]="size() === 'sm'" aria-hidden="true">
      @for (bar of bars(); track bar) {
        <span class="form-strip-slot" [appHoverTip]="tips() ? bar.tip : null">
          <span
            class="form-strip-bar"
            [class]="'form-strip-' + bar.result"
            [style.--h]="bar.height"
            [style.--i]="$index"
          ></span>
        </span>
      }
    </span>
  `,
  styleUrl: './form-strip.css',
  host: { class: 'inline-flex' },
})
export class FormStrip {
  public readonly matches = input.required<readonly FormMatch[]>();
  public readonly size = input<'md' | 'sm'>('md');
  /** Hover tips per bar; off in dense lists where the row already names the matches. */
  public readonly tips = input(true);

  protected readonly bars = computed(() => formBars(this.matches()));
}
