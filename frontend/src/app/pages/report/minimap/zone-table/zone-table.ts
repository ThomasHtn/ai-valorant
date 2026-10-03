import { Component, computed, input, output } from '@angular/core';

import { formatValue, integer } from '@core/format/value-format.utils';
import { ZoneRow } from '@core/report/minimap.model';
import { HoverTip } from '@shared/hover-tip/hover-tip';
import { InfoTip } from '@shared/info-tip/info-tip';
import { RoundLink } from '@shared/round-link/round-link';

import { shareTip, zoneRows } from '../minimap.utils';

/** Number of rounds linked per zone, and of players named. */
const MAX_REFS = 6;
const MAX_PLAYERS = 3;

/**
 * Zones of the map on one side, by first deaths: share of the side's first deaths against the top
 * ranked (bar with a tick), deaths, kills, revenge rate, players and rounds. Hovering a row circles
 * the zone on the map.
 */
@Component({
  selector: 'app-zone-table',
  imports: [HoverTip, InfoTip, RoundLink],
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

  protected readonly lines = computed(() =>
    zoneRows(this.rows()).map((row) => ({
      row,
      players: row.players
        .slice(0, MAX_PLAYERS)
        .map((p) => `${p.name} ${p.deaths}`)
        .join(', '),
      refs: row.refs.slice(0, MAX_REFS),
      share: formatValue(row.firstDeathShare, 'pct'),
      shareWidth: Math.min(100, (row.firstDeathShare ?? 0) * 100),
      topTick: row.topFirstDeathShare === null ? null : Math.min(100, row.topFirstDeathShare * 100),
      shareTip: shareTip(row),
      revenge: formatValue(row.revengeRate, 'pct'),
    })),
  );
  protected readonly integer = integer;
}
