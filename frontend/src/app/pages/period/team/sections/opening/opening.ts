import { Component, computed, input } from '@angular/core';

import { SIDE_LABELS } from '@core/format/labels.constants';
import { Opening as OpeningData } from '@core/periods/team.model';
import { DuelMap } from '@shared/duel-map/duel-map';
import { DuelMapLegend } from '@shared/duel-map/duel-map-legend';
import { GapList } from '@shared/gap-list/gap-list';
import { InfoTip } from '@shared/info-tip/info-tip';

import { openingSideLines, playerDuelLines, playerRecoverLines } from './opening-lines.utils';

/** Opening duels: first bloods and what follows by side, where they happen, then each player. */
@Component({
  selector: 'app-opening',
  imports: [InfoTip, DuelMap, DuelMapLegend, GapList],
  templateUrl: './opening.html',
})
export class Opening {
  public readonly opening = input.required<OpeningData>();

  protected readonly sideLabels = SIDE_LABELS;
  protected readonly sideLines = computed(() => openingSideLines(this.opening()));
  protected readonly playerDuels = computed(() => playerDuelLines(this.opening()));
  protected readonly playerRecovers = computed(() => playerRecoverLines(this.opening()));
}
