import { Component, computed, inject, input } from '@angular/core';

import { resourceValue } from '@core/http/resource-state.utils';
import { ReportApi } from '@core/report/report-api';
import { ReportContext } from '@core/report/report-context';
import { ViewState } from '@core/report/view-state';
import { provideViewState } from '@core/report/view-states';
import { ReadingBar } from '@shared/reading-bar/reading-bar';
import { InfoTip } from '@shared/info-tip/info-tip';
import { ResourceState } from '@shared/resource-state/resource-state';
import { StatTableView } from '@shared/stat-table/stat-table';

import { DeathZones } from './death-zones/death-zones';
import { OpeningClutch } from './opening-clutch/opening-clutch';
import { PlayerCard } from './player-card/player-card';
import { PlayerRail } from './player-rail/player-rail';
import { PlayerVerdictView } from './player-verdict/player-verdict';
import { PANEL_CLASS } from './players.constants';
import { playerReferenceNames } from './players-reference.utils';
import { economyFormat, headlineFigure } from './players.utils';
import { ProfileRadar } from './profile-radar/profile-radar';
import { RadarSeries } from './profile-radar/profile-radar.model';
import { radarStats } from './profile-radar/profile-radar.utils';
import { RewatchList } from './rewatch-list/rewatch-list';
import { StatBars } from './stat-bars/stat-bars';
import { statBarRows } from './stat-bars/stat-bars.utils';
import { WeaponsPanel } from './weapons-panel/weapons-panel';

/**
 * Joueurs: the sheet of one squad player, read like a game's career screen. His card, then his
 * strengths and what to work on against the view's reference (opponents of his role by default, top
 * ranked of his role, or his own history), his key figures as a radar and gauges, opening duels and
 * clutches, weapons, economy (always against the top ranked), results by map, agent and side, ability
 * casts, death zones and first deaths to rewatch.
 */
@Component({
  selector: 'app-players-view',
  imports: [
    InfoTip,
    ReadingBar,
    ResourceState,
    StatTableView,
    PlayerRail,
    PlayerCard,
    PlayerVerdictView,
    ProfileRadar,
    StatBars,
    OpeningClutch,
    WeaponsPanel,
    DeathZones,
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
  protected readonly panel = PANEL_CLASS;
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
  private readonly loaded = computed(() => resourceValue(this.sheet, null));

  /** Who he is measured against: 'les initiateurs des équipes affrontées'. */
  protected readonly names = computed(() =>
    playerReferenceNames(
      this.state.preferences().reference,
      this.loaded()?.role ?? '',
      this.context.historyLabel(),
    ),
  );
  private readonly topNames = computed(() =>
    playerReferenceNames('top', this.loaded()?.role ?? '', this.context.historyLabel()),
  );
  /** Economy always faces the top ranked of his role, whatever the reference chosen. */
  protected readonly economyNote = computed(
    () => `Hors pistols, toujours comparé ${this.topNames().sentence.replace(/^les /, 'aux ')}.`,
  );

  /** His key figures: the role's headline figures and his opening duels won. */
  protected readonly figures = computed(() => {
    const sheet = this.loaded();
    return sheet ? radarStats(sheet.headline, sheet.openingDuels) : [];
  });
  protected readonly figureRows = computed(() =>
    statBarRows(this.figures(), this.state.preferences().reference, this.names().short),
  );
  protected readonly economyRows = computed(() =>
    statBarRows((this.loaded()?.economy ?? []).map(headlineFigure), 'top', this.topNames().short, {
      bars: false,
      format: economyFormat,
    }),
  );

  /**
   * Full-width tables by map, by agent, by side, then ability casts, prepared here so the template
   * gets a stable array. The agent table is left out for a one-agent player: his card already names
   * it and the row would repeat the totals.
   */
  protected readonly tables = computed(() => {
    const sheet = this.loaded();
    if (!sheet) {
      return [];
    }
    return sheet.agents.length > 1
      ? [sheet.byMap, sheet.byAgent, sheet.bySide, sheet.utility]
      : [sheet.byMap, sheet.bySide, sheet.utility];
  });
  /** The player alone on his radar, his points coloured like his figures. */
  protected readonly radarSeries = computed<RadarSeries[]>(() => {
    const sheet = this.loaded();
    return sheet ? [{ name: sheet.name, stats: this.figures(), colour: null }] : [];
  });
}
