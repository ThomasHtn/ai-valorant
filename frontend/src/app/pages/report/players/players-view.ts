import { Component, computed, inject, input } from '@angular/core';

import { resourceValue } from '@core/http/resource-state.utils';
import { ReportApi } from '@core/report/report-api';
import { ReportContext } from '@core/report/report-context';
import { ViewState } from '@core/report/view-state';
import { provideViewState } from '@core/report/view-states';
import { ReadingBar } from '@shared/reading-bar/reading-bar';
import { ResourceState } from '@shared/resource-state/resource-state';
import { StatTableView } from '@shared/stat-table/stat-table';

import { DeathZones } from './death-zones/death-zones';
import { FormTiles } from './form-tiles/form-tiles';
import { OpeningClutch } from './opening-clutch/opening-clutch';
import { PlayerHeader } from './player-header/player-header';
import { PlayerPicker } from './player-picker/player-picker';
import { ProfileFigures } from './profile-figures/profile-figures';
import { ProfileRadar } from './profile-radar/profile-radar';
import { RadarSeries } from './profile-radar/profile-radar.model';
import { radarStats } from './profile-radar/profile-radar.utils';
import { RewatchList } from './rewatch-list/rewatch-list';
import { WeaponsPanel } from './weapons-panel/weapons-panel';

/**
 * Joueurs: the sheet of one squad player. Every figure sits beside the view's own reference
 * (opponents of his role by default, top ranked of his role, or his own history): profile (radar and
 * its figures), opening duels, clutches, weapons, results by map, agent and side, death zones, form
 * match by match and first deaths to rewatch.
 */
@Component({
  selector: 'app-players-view',
  imports: [
    ReadingBar,
    ResourceState,
    StatTableView,
    PlayerPicker,
    PlayerHeader,
    ProfileRadar,
    ProfileFigures,
    OpeningClutch,
    WeaponsPanel,
    DeathZones,
    FormTiles,
    RewatchList,
  ],
  host: { class: 'view-body' },
  providers: [provideViewState('players')],
  templateUrl: './players-view.html',
})
export class PlayersView {
  /** Route parameter: the player's name. */
  public readonly player = input<string>();

  protected readonly context = inject(ReportContext);
  protected readonly state = inject(ViewState);
  private readonly api = inject(ReportApi);

  protected readonly players = this.api.players(this.context.query);
  /** The route's player, else the first squad player of the period. */
  protected readonly selected = computed<string | null>(() => {
    const list = resourceValue(this.players, null) ?? [];
    return (
      list.find((p) => p.name === this.player())?.name ?? this.player() ?? list[0]?.name ?? null
    );
  });
  protected readonly sheet = this.api.player(this.context.query, this.selected);

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
  /** The player alone on his radar, his points coloured like his tiles. */
  protected readonly radarSeries = computed<RadarSeries[]>(() => {
    const sheet = resourceValue(this.sheet, null);
    return sheet
      ? [{ name: sheet.name, stats: radarStats(sheet.headline, sheet.openingDuels), colour: null }]
      : [];
  });
  protected readonly acs = computed(() =>
    resourceValue(this.sheet, null)?.headline.find((h) => h.key === 'acs'),
  );
}
