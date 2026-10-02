import { NgTemplateOutlet } from '@angular/common';
import { Component, input } from '@angular/core';

import { decimal, percentOf } from '@core/format/format.utils';
import { Correlations as CorrelationsData } from '@core/periods/insights.model';
import { InfoTip } from '@shared/info-tip/info-tip';

/** Strength thresholds of a correlation coefficient. */
const STRONG = 0.5;
const MODERATE = 0.3;

/** Per-match stats against the share of rounds won: what goes with the squad's wins. */
@Component({
  selector: 'app-correlations',
  imports: [InfoTip, NgTemplateOutlet],
  templateUrl: './correlations.html',
})
export class Correlations {
  public readonly correlations = input.required<CorrelationsData>();

  protected readonly percentOf = percentOf;

  protected coefficient(r: number | null): string {
    return decimal(r, 2, true);
  }

  protected strength(r: number | null): string {
    if (r === null) {
      return '';
    }
    const label = Math.abs(r) >= STRONG ? 'forte' : Math.abs(r) >= MODERATE ? 'modérée' : 'faible';
    return `Corrélation ${label} (r = ${decimal(r, 2, true)})`;
  }

  protected barWidth(r: number | null): number {
    return r === null ? 0 : Math.round(Math.abs(r) * 100);
  }
}
