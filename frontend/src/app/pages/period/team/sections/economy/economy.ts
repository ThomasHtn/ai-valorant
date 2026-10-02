import { Component, input } from '@angular/core';

import { Economy as EconomyData } from '@core/periods/team.model';
import { InfoTip } from '@shared/info-tip/info-tip';

import { BuyResults } from './buy-results/buy-results';

/** Rounds won by buy, pistols first. */
@Component({
  selector: 'app-economy',
  imports: [BuyResults, InfoTip],
  templateUrl: './economy.html',
})
export class Economy {
  public readonly economy = input.required<EconomyData>();
}
