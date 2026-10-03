import { Component, computed, input, output } from '@angular/core';

import { integer } from '@core/format/value-format.utils';
import { ZoneRow } from '@core/report/minimap.model';
import { GapChip } from '@shared/gap-chip/gap-chip';
import { HoverTip } from '@shared/hover-tip/hover-tip';
import { InfoTip } from '@shared/info-tip/info-tip';
import { RoundLink } from '@shared/round-link/round-link';

import { zoneLines } from '../minimap.utils';

/**
 * Zones of the map on one side, the biggest excess of first deaths over the top ranked first: squad
 * share (bar with a tick at the top ranked), top ranked share, gap, deaths, kills, revenge, players
 * and rounds. Hovering a row circles the zone on the map.
 */
@Component({
  selector: 'app-zone-table',
  imports: [GapChip, HoverTip, InfoTip, RoundLink],
  templateUrl: './zone-table.html',
  host: { class: 'flex min-w-0 flex-col gap-2 bg-text-primary/4 px-3.5 py-3' },
})
export class ZoneTable {
  public readonly map = input.required<string>();
  /** 'attaque' or 'défense', for the title. */
  public readonly sideLabel = input.required<string>();
  public readonly rows = input.required<readonly ZoneRow[]>();
  public readonly squadFirstDeaths = input(0);
  public readonly topFirstDeaths = input(0);
  public readonly highlight = output<string | null>();

  protected readonly lines = computed(() => zoneLines(this.rows()));
  protected readonly integer = integer;
}
