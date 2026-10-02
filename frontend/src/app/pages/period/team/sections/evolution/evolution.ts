import { Component, computed, input } from '@angular/core';

import { percent, pointsChange, signedPoints } from '@core/format/format.utils';
import { scopeBadges } from '@core/periods/finding-format.utils';
import { Evolution as EvolutionData, EvolutionLine } from '@core/periods/findings.model';
import { PointCard } from '@shared/point-card/point-card';
import { InfoTip } from '@shared/info-tip/info-tip';
import { PointCardContent } from '@shared/point-card/point-card.model';

/** Key squad metrics against the comparison period; net changes first, every metric folded below. */
@Component({
  selector: 'app-evolution',
  imports: [InfoTip, PointCard],
  templateUrl: './evolution.html',
})
export class Evolution {
  public readonly evolution = input.required<EvolutionData>();

  /** Net changes only, as cards. */
  protected readonly cards = computed<PointCardContent[]>(() =>
    this.evolution()
      .lines.filter((l) => l.significant)
      .map((line) => ({
        badges: scopeBadges(line.scope),
        status: null,
        title: line.label,
        value: `${percent(line.previous)} → ${percent(line.current)}`,
        details: ['changement net par rapport à la période de comparaison'],
        tone: line.better ? 'good' : 'bad',
      })),
  );
  protected readonly percent = percent;

  protected change(line: EvolutionLine): string {
    return (
      signedPoints(pointsChange(line.current, line.previous) ?? 0) +
      (line.significant ? ' (net)' : '')
    );
  }
}
