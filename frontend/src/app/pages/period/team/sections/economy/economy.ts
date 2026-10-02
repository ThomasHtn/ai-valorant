import { Component, computed, input } from '@angular/core';

import { BuyType } from '@core/common/enums.model';
import { fraction, percent } from '@core/format/format.utils';
import { BUY_LABELS, SIDE_LABELS } from '@core/format/labels.constants';
import { BuyMatchup, Economy as EconomyData } from '@core/periods/team.model';
import { ChartValueFormatter } from '@shared/chart/chart.model';
import { cohortSeries } from '@shared/chart/cohort-series.utils';
import { GroupedBarChart } from '@shared/chart/grouped-bar-chart';
import { HeatCell } from '@shared/heat-cell/heat-cell';
import { RateBar } from '@shared/rate-bar/rate-bar';
import { InfoTip } from '@shared/info-tip/info-tip';

const BUYS: BuyType[] = ['eco', 'force', 'full'];

/** Pistol rounds, the rounds that follow them, and results by buy against buy. */
@Component({
  selector: 'app-economy',
  imports: [InfoTip, GroupedBarChart, HeatCell, RateBar],
  templateUrl: './economy.html',
})
export class Economy {
  public readonly economy = input.required<EconomyData>();

  protected readonly buys = BUYS;
  protected readonly percent = percent;
  protected readonly fraction = fraction;
  protected readonly sideLabels = SIDE_LABELS;
  protected readonly buyLabels = BUY_LABELS;

  protected readonly buyCategories = BUYS.map((buy) => BUY_LABELS[buy]);
  protected readonly percentFormatter: ChartValueFormatter = (value) => `${Math.round(value)} %`;

  /** Share of each buy per cohort, one series per cohort. */
  protected readonly buySeries = computed(() =>
    this.economy().buyShares.map((share) =>
      cohortSeries(share.cohort, [share.eco, share.force, share.full], share.cohort !== 'top'),
    ),
  );

  protected readonly afterPistol = computed(() =>
    [true, false].map((won) => ({
      label: won ? 'Pistol gagné' : 'Pistol perdu',
      cells: this.economy().afterPistol.filter((f) => f.pistolWon === won),
    })),
  );

  protected matchup(own: BuyType, opp: BuyType): BuyMatchup | undefined {
    return this.economy().buyMatrix.find((m) => m.ownBuy === own && m.oppBuy === opp);
  }
}
