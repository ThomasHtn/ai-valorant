import { Component, computed, inject, input, signal } from '@angular/core';

import { resourceValue } from '@core/http/resource-state.utils';
import { PeriodsApi } from '@core/periods/periods-api';
import { ResourceState } from '@shared/resource-state/resource-state';
import { PickerTabs } from '@shared/tabs/picker-tabs';
import { PickerItem } from '@shared/tabs/tabs.model';

import { PeriodContext } from '@core/periods/period-context';
import { PlayerProfileView } from './player-profile/player-profile';
import { DEFAULT_PLAYER_SECTION } from './player-profile/player-profile.constants';

/** Players tab: one portrait per profiled player, most rounds first; the first one opens by default. */
@Component({
  selector: 'app-players-tab',
  imports: [PickerTabs, ResourceState, PlayerProfileView],
  templateUrl: './players-tab.html',
})
export class PlayersTab {
  /** Route parameter (`/periods/players/:puuid`). */
  public readonly puuid = input<string>();

  private readonly context = inject(PeriodContext);

  protected readonly players = computed(
    () => resourceValue(this.context.overview, null)?.players ?? [],
  );
  protected readonly selected = computed(() => this.puuid() ?? this.players()[0]?.puuid ?? null);
  protected readonly profile = inject(PeriodsApi).player(this.context.query, this.selected);

  protected readonly tabs = computed<PickerItem[]>(() =>
    this.players().map((p) => ({
      id: p.puuid,
      label: p.name,
      agent: p.mainAgent,
      link: ['/periods/players', p.puuid],
    })),
  );

  /** Open part of the profile, kept when moving to another player. */
  protected readonly section = signal(DEFAULT_PLAYER_SECTION);
}
