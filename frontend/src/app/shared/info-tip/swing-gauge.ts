import { Component, computed, input } from '@angular/core';

import { WinChanceSwing } from '@core/help/stat-help.model';

/** Chance of winning the round before and after an action, the change highlighted on the bar. */
@Component({
  selector: 'app-swing-gauge',
  template: `
    @let s = swing();
    <div class="track">
      <i class="before" [style.width.%]="100 * low()"></i>
      <i
        class="change"
        [class.loss]="loss()"
        [style.left.%]="100 * low()"
        [style.width.%]="100 * (high() - low())"
      ></i>
    </div>
    <b class="delta" [class.loss]="loss()">{{ delta() }}</b>
    <div class="scale" aria-hidden="true">
      <span [style.left.%]="100 * s.from">{{ percent(s.from) }}</span>
      <span [style.left.%]="100 * s.to">{{ percent(s.to) }}</span>
    </div>
  `,
  styleUrl: './swing-gauge.css',
  host: { role: 'img', '[attr.aria-label]': 'label()' },
})
export class SwingGauge {
  public readonly swing = input.required<WinChanceSwing>();

  protected readonly loss = computed(() => this.swing().to < this.swing().from);
  protected readonly low = computed(() => Math.min(this.swing().from, this.swing().to));
  protected readonly high = computed(() => Math.max(this.swing().from, this.swing().to));
  protected readonly delta = computed(() => {
    const points = Math.round(100 * (this.swing().to - this.swing().from));
    return points > 0 ? `+${points}` : `${points}`;
  });
  protected readonly label = computed(
    () =>
      `Chances de gagner le round : de ${this.percent(this.swing().from)} à ${this.percent(this.swing().to)}`,
  );

  protected percent(value: number): string {
    return `${Math.round(100 * value)} %`;
  }
}
