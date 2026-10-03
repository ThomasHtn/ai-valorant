import { Component, computed, inject, input } from '@angular/core';

import { resourceValue } from '@core/http/resource-state.utils';
import { ReportApi } from '@core/report/report-api';
import { ReportContext } from '@core/report/report-context';
import { ReportState } from '@core/report/report-state';
import { FilterBar } from '@shared/filter-bar/filter-bar';
import { ResourceState } from '@shared/resource-state/resource-state';
import { StatTableView } from '@shared/stat-table/stat-table';
import { ToneLegend } from '@shared/tone-legend/tone-legend';

import { DeathZones } from './death-zones/death-zones';
import { FormTiles } from './form-tiles/form-tiles';
import { HeadlineBand } from './headline-band/headline-band';
import { OpeningClutch } from './opening-clutch/opening-clutch';
import { PlayerHeader } from './player-header/player-header';
import { PlayerPicker } from './player-picker/player-picker';
import { PlayerReference } from './player-reference/player-reference';
import { roleLabel } from './players.utils';
import { RewatchList } from './rewatch-list/rewatch-list';
import { WeaponsPanel } from './weapons-panel/weapons-panel';

/**
 * Joueurs: the sheet of one squad player. Every figure sits beside the view's own reference
 * (opponents of his role by default, top ranked of his role, or his own history): headline band, results by map, agent and side,
 * opening duels, clutches, weapons, death zones, form match by match and first deaths to rewatch.
 */
@Component({
  selector: 'app-players-view',
  imports: [
    FilterBar,
    ToneLegend,
    ResourceState,
    StatTableView,
    PlayerPicker,
    PlayerReference,
    PlayerHeader,
    HeadlineBand,
    OpeningClutch,
    WeaponsPanel,
    DeathZones,
    FormTiles,
    RewatchList,
  ],
  host: { class: 'view-body' },
  templateUrl: './players-view.html',
})
export class PlayersView {
  /** Route parameter: the player's name. */
  public readonly player = input<string>();

  protected readonly context = inject(ReportContext);
  protected readonly state = inject(ReportState);
  private readonly api = inject(ReportApi);

  protected readonly players = this.api.players(this.context.query);
  /** The route's player, else the player filter, else the first squad player of the period. */
  protected readonly selected = computed<string | null>(() => {
    const list = resourceValue(this.players, null) ?? [];
    const wanted = this.player() || this.state.filters().player;
    return list.find((p) => p.name === wanted)?.name ?? this.player() ?? list[0]?.name ?? null;
  });
  protected readonly sheet = this.api.player(this.context.query, this.selected);

  /** Display preferences with the Joueurs view's own reference in place of the global one. */
  protected readonly sheetDisplay = computed(() => {
    const preferences = this.state.preferences();
    return { ...preferences, reference: preferences.playerReference };
  });

  protected readonly roleLabel = computed(() => {
    const sheet = resourceValue(this.sheet, null);
    return sheet ? roleLabel(sheet.role) : '';
  });
  /**
   * By map, by agent, by side: prepared here so the template gets a stable array. The agent table is
   * left out for a one-agent player: the header already names it and the row would repeat the totals.
   */
  protected readonly tables = computed(() => {
    const sheet = resourceValue(this.sheet, null);
    if (!sheet) {
      return [];
    }
    return sheet.agents.length > 1
      ? [sheet.byMap, sheet.byAgent, sheet.bySide]
      : [sheet.byMap, sheet.bySide];
  });
  protected readonly acs = computed(() =>
    resourceValue(this.sheet, null)?.headline.find((h) => h.key === 'acs'),
  );
}
