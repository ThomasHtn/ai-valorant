import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ZoneRow } from '@core/report/minimap.model';
import { GapChip } from '@shared/gap-chip/gap-chip';
import { InfoTip } from '@shared/info-tip/info-tip';

import { zoneLines, zoneMatchCount, zoneVerdict } from '../minimap.utils';
import { ROUND_CHIP_CLASSES } from './zone-table.constants';

/**
 * Zones of the map on one side under a verdict, the biggest excess of first deaths over the top
 * ranked first. Two column groups keep the questions apart: first deaths (squad share and count, top
 * ranked share, gap), then every death and kill there. Under each zone, one line per player who died
 * there with their rounds. Hovering a zone circles it on the map.
 */
@Component({
  selector: 'app-zone-table',
  imports: [GapChip, InfoTip, RouterLink],
  templateUrl: './zone-table.html',
  host: { class: 'flex min-w-0 flex-col gap-2 bg-text-primary/4 px-3.5 py-3' },
})
export class ZoneTable {
  public readonly map = input.required<string>();
  /** 'attaque' or 'défense', for the title. */
  public readonly sideLabel = input.required<string>();
  public readonly rows = input.required<readonly ZoneRow[]>();
  public readonly squadFirstDeaths = input(0);
  public readonly highlight = output<string | null>();

  protected readonly lines = computed(() => zoneLines(this.rows(), this.squadFirstDeaths()));
  protected readonly verdict = computed(() =>
    zoneVerdict(this.lines(), this.squadFirstDeaths(), this.sideLabel()),
  );
  /** Dates name the match only when the side spans several; one match needs round chips alone. */
  protected readonly showMatch = computed(() => zoneMatchCount(this.rows()) > 1);
  protected readonly chip = ROUND_CHIP_CLASSES;
}
