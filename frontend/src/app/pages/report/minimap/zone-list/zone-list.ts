import { Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideChevronDown } from '@lucide/angular';

import { ZoneRow } from '@core/report/minimap.model';
import { InfoTip } from '@shared/info-tip/info-tip';

import { zoneLines, zoneMatchCount } from '../minimap.utils';
import { ROUND_CHIP_CLASSES, ZONE_BAR_CLASSES } from './zone-list.constants';

/**
 * Where the squad dies first on one map and side: one bar row per zone, the squad's share of first
 * deaths against a tick at the top ranked share, the costliest zone first. A row opens on who died
 * there and the rounds to rewatch; hovering it circles the zone on the map.
 */
@Component({
  selector: 'app-zone-list',
  imports: [InfoTip, LucideChevronDown, RouterLink],
  templateUrl: './zone-list.html',
  host: { class: 'flex min-w-0 flex-col gap-3 bg-text-primary/4 px-3.5 py-3' },
})
export class ZoneList {
  public readonly rows = input.required<readonly ZoneRow[]>();
  public readonly squadFirstDeaths = input(0);
  public readonly highlight = output<string | null>();

  protected readonly lines = computed(() => zoneLines(this.rows(), this.squadFirstDeaths()));
  /** Dates name the match only when the side spans several; one match needs round chips alone. */
  protected readonly showMatch = computed(() => zoneMatchCount(this.rows()) > 1);
  /** The zone whose players and rounds are shown; one at a time. */
  protected readonly openZone = signal<string | null>(null);
  protected readonly chip = ROUND_CHIP_CLASSES;
  protected readonly bar = ZONE_BAR_CLASSES;

  protected toggle(zone: string): void {
    this.openZone.update((current) => (current === zone ? null : zone));
  }
}
