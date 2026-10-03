import { Component, computed, input } from '@angular/core';

import { StatHelp } from '@core/help/stat-help.model';
import { CellTone } from '@core/report/tone.model';
import { InfoTip } from '@shared/info-tip/info-tip';

import { TONE_TEXT_CLASSES } from './stat-tile.constants';

/**
 * A headline figure: its name with an "i", the value in Oswald coloured by its tone, then up to two
 * short lines (reference, sample). Tiles sit in a grid with 2px gaps, like the rows of a table.
 */
@Component({
  selector: 'app-stat-tile',
  imports: [InfoTip],
  template: `
    <span class="text-[0.92rem] text-text-secondary"
      >{{ label() }}<app-info-tip [topic]="help()" [content]="helpContent()"
    /></span>
    <span
      class="font-display text-[1.6rem] leading-tight font-semibold tabular-nums"
      [class]="valueClass()"
      >{{ value() }}</span
    >
    @for (line of lines(); track $index) {
      <span class="text-[0.85rem] text-text-muted">{{ line }}</span>
    }
  `,
  host: { class: 'flex min-w-0 flex-col gap-0.5 bg-text-primary/4 px-3 py-2.5' },
})
export class StatTile {
  public readonly label = input.required<string>();
  /** Already formatted value ('281', '56 %'). */
  public readonly value = input.required<string>();
  /** Colour of the value; null leaves it uncoloured. */
  public readonly tone = input<CellTone | null>(null);
  /** Extra classes of the value, e.g. the top ranked colour. */
  public readonly colourClass = input<string | null>(null);
  /** Lines under the value: reference, sample. */
  public readonly lines = input<string[]>([]);
  /** Glossary key of the "i" tip... */
  public readonly help = input<string | null>(null);
  /** ...or its text, for figures without a glossary entry. */
  public readonly helpContent = input<StatHelp | null>(null);

  protected readonly valueClass = computed(() => {
    const tone = this.tone();
    return this.colourClass() ?? (tone ? TONE_TEXT_CLASSES[tone] : 'text-text-primary');
  });
}
