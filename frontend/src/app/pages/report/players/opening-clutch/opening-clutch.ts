import { Component, computed, input } from '@angular/core';

import { Reference } from '@core/common/enums.model';
import { REFERENCE_SHORT_LABELS } from '@core/format/labels.constants';
import { ClutchLine, OpeningDuels } from '@core/report/players.model';
import { InfoTip } from '@shared/info-tip/info-tip';
import { StatTile } from '@shared/stat-tile/stat-tile';
import { TONE_TEXT_CLASSES } from '@shared/stat-tile/stat-tile.constants';

import { clutchBars, figureTile, openingColumn } from '../players.utils';

/**
 * Two panels of the player sheet: his opening duels (won, rounds won after his first blood and after
 * his first death) and his clutches by size, as bars with a tick at the reference.
 */
@Component({
  selector: 'app-opening-clutch',
  imports: [StatTile, InfoTip],
  templateUrl: './opening-clutch.html',
  host: { class: 'flex flex-col gap-5' },
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
      { key: 'duelsWon', label: 'Duels gagnés', help: 'playerOpeningDuels', cell: duels.duelsWon },
      {
        key: 'afterFb',
        label: 'Gagnés après sa FB',
        help: 'wonAfterFirstBlood',
        cell: duels.wonAfterFirstBlood,
      },
      {
        key: 'afterFd',
        label: 'Gagnés après sa FD',
        help: 'wonAfterFirstDeath',
        cell: duels.wonAfterFirstDeath,
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
      ),
    );
  });

  protected readonly bars = computed(() =>
    clutchBars(this.clutches(), this.reference(), this.colours()),
  );
}
