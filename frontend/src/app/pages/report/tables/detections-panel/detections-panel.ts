import { Component, computed, input } from '@angular/core';

import { Detections } from '@core/report/detections.model';
import { resolveArt } from '@shared/game-art/art.utils';
import { RowArt } from '@shared/game-art/row-art';
import { InfoTip } from '@shared/info-tip/info-tip';
import { RewatchLinks } from '@shared/rewatch-links/rewatch-links';

import { detectionGroups } from './detections-panel.utils';

/**
 * Détections entry of the Tableaux view: what the tool finds on its own in the period, without
 * interpretation, each line with its figures, its sample and the rounds behind it.
 */
@Component({
  selector: 'app-detections-panel',
  imports: [InfoTip, RowArt, RewatchLinks],
  templateUrl: './detections-panel.html',
  host: { class: 'flex min-w-0 flex-col gap-8' },
})
export class DetectionsPanel {
  public readonly detections = input.required<Detections>();
  public readonly playerAgents = input<Record<string, string>>({});

  protected readonly groups = computed(() =>
    detectionGroups(this.detections()).map((group) => ({
      ...group,
      items: group.items.map((item) => ({
        ...item,
        art: resolveArt(item.art, this.playerAgents()),
      })),
    })),
  );
}
