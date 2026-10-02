import { Component, computed, input } from '@angular/core';

import { statValue } from '@core/format/format.utils';
import { Tone } from '@core/common/enums.model';
import { helpFor } from '@core/help/stat-help.constants';
import { StatHelp } from '@core/help/stat-help.model';
import { StatComparison } from '@core/periods/player.model';
import { RATING_TEXT_CLASS } from '@core/rating/rating.constants';
import { rateTone } from '@core/rating/rating.utils';
import { StatDefinition } from '@core/reference/reference.model';
import { InfoTip } from '@shared/info-tip/info-tip';

/** Every statistic of a player next to same-elo opponents and top ranked players on the same agents. */
@Component({
  selector: 'app-player-stats-table',
  imports: [InfoTip],
  templateUrl: './player-stats-table.html',
  host: { class: 'table-scroll block' },
})
export class PlayerStatsTable {
  public readonly stats = input.required<StatComparison[]>();
  public readonly definitions = input.required<Map<string, StatDefinition>>();
  public readonly name = input.required<string>();

  /** Built once per input so the template never passes a fresh object to the tips. */
  protected readonly helps = computed(() => {
    const helps = new Map<string, StatHelp>();
    for (const stat of this.stats()) {
      const definition = this.definitions().get(stat.key);
      const help =
        helpFor(stat.key) ??
        (definition ? { title: definition.label, what: definition.definition } : null);
      if (help) {
        helps.set(stat.key, help);
      }
    }
    return helps;
  });

  /** Green or red when the gap with same-elo opponents is clear, amber when it is not. */
  protected toneClass(tone: Tone): string {
    return RATING_TEXT_CLASS[rateTone(tone)];
  }

  protected format(key: string, value: number | null): string {
    return statValue(this.definitions().get(key), value);
  }

  /** ▲ or ▼ when the gap with the top ranked reference is clear. */
  protected arrow(stat: StatComparison): string {
    if (stat.versusTop === 'neutral' || stat.value === null || stat.top === null) {
      return '';
    }
    return stat.value > stat.top ? '▲' : '▼';
  }
}
