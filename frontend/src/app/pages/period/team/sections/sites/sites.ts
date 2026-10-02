import { Component, computed, input } from '@angular/core';

import { Sites as SitesData } from '@core/periods/team.model';
import { GapList } from '@shared/gap-list/gap-list';
import { InfoTip } from '@shared/info-tip/info-tip';

import { numbersLines, postPlantLines, retakeLines, tempoLines } from './site-lines.utils';

/** Post-plants and retakes by site, by plant time and by players alive, the costliest first. */
@Component({
  selector: 'app-sites',
  imports: [GapList, InfoTip],
  templateUrl: './sites.html',
})
export class Sites {
  public readonly sites = input.required<SitesData>();

  protected readonly postPlants = computed(() => postPlantLines(this.sites().rows));
  protected readonly retakes = computed(() => retakeLines(this.sites().rows));
  protected readonly tempo = computed(() => tempoLines(this.sites().tempo));
  protected readonly attackNumbers = computed(() =>
    numbersLines(this.sites().numbersAtPlant, 'attack'),
  );
  protected readonly defenseNumbers = computed(() =>
    numbersLines(this.sites().numbersAtPlant, 'defense'),
  );
}
