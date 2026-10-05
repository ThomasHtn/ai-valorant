import { Component, input } from '@angular/core';

import { BetterHint } from '@shared/better-hint/better-hint';
import { InfoTip } from '@shared/info-tip/info-tip';

/**
 * Header cell of a board, in the stat tables' style: label, which way is better, its "i", and a
 * quiet line saying what the figure is read against ('trait blanc : top ranked').
 */
@Component({
  selector: 'th[appColHead]',
  imports: [BetterHint, InfoTip],
  template: `
    {{ label() }}
    @if (better()) {
      <app-better-hint class="ml-0.5" [better]="better()" [compact]="true" />
    }
    <app-info-tip [topic]="help()" />
    @if (vs()) {
      <span class="mt-0.5 block text-xs leading-none font-normal tracking-normal normal-case">{{
        vs()
      }}</span>
    }
    <ng-content />
  `,
  host: { scope: 'col', '[class.num]': "align() === 'end'", '[class.mid]': "align() === 'center'" },
})
export class ColHead {
  public readonly label = input('');
  /** 1 higher is better, -1 lower is better, 0 neutral. */
  public readonly better = input(0);
  public readonly help = input<string | null>(null);
  public readonly vs = input<string | null>(null);
  public readonly align = input<'start' | 'end' | 'center'>('start');
}
