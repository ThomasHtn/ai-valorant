import { Component, computed, input } from '@angular/core';

import { Reference } from '@core/common/enums.model';
import { REFERENCE_SHORT_LABELS } from '@core/format/labels.constants';
import { ClutchLine, OpeningDuels } from '@core/report/players.model';
import { InfoTip } from '@shared/info-tip/info-tip';
import { StatTile } from '@shared/stat-tile/stat-tile';
import { TONE_TEXT_CLASSES } from '@shared/stat-tile/stat-tile.constants';

import { clutchBars, figureTile, openingColumn } from '../players.utils';

/**
 * Two panels of the player sheet: what the squad makes of his premiers duels (rounds won after his
 * first blood and after his first death; the duels won sit in his profile) and his clutches by size,
 * as bars with a tick at the reference.
 */
@Component({
  selector: 'app-opening-clutch',
  imports: [StatTile, InfoTip],
  templateUrl: './opening-clutch.html',
  host: { class: 'flex flex-col gap-10' },
})
export class OpeningClutch {
  public readonly openingDuels = input.required<OpeningDuels>();
  public readonly clutches = input.required<ClutchLine[]>();
  public readonly reference = input.required<Reference>();
  public readonly colours = input(true);

  protected readonly referenceLabel = computed(() => REFERENCE_SHORT_LABELS[this.reference()]);
  protected readonly toneText = TONE_TEXT_CLASSES;

  protected readonly openingTiles = computed(() => {
    const duels = this.openingDuels();
    const figures = [
      {
        key: 'afterFb',
        label: 'Gagnés après sa FB',
        help: 'wonAfterFirstBlood',
        cell: duels.wonAfterFirstBlood,
        unit: 'rounds',
      },
      {
        key: 'afterFd',
        label: 'Gagnés après sa FD',
        help: 'wonAfterFirstDeath',
        cell: duels.wonAfterFirstDeath,
        unit: 'rounds',
      },
    ];
    return figures.map((f) =>
      figureTile(
        f.key,
        f.label,
        f.help,
        f.cell,
        openingColumn(f.key, f.label),
        this.reference(),
        this.colours(),
        f.unit,
      ),
    );
  });

  protected readonly bars = computed(() =>
    clutchBars(this.clutches(), this.reference(), this.colours()),
  );
}
