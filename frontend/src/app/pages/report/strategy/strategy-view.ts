import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideBomb,
  LucideShield,
  LucideSparkles,
  LucideTrendingUp,
  LucideUsers,
} from '@lucide/angular';

import { mapSplash } from '@core/game-assets/game-assets.utils';
import { resourceValue } from '@core/http/resource-state.utils';
import { periodQueryParams } from '@core/report/period-query.utils';
import { ReportApi } from '@core/report/report-api';
import { ReportContext } from '@core/report/report-context';
import { AgentIcon } from '@shared/game-art/agent-icon';
import { MapThumb } from '@shared/game-art/map-thumb';
import { RoleIcon } from '@shared/game-art/role-icon';
import { MinimapCanvas } from '@shared/minimap-canvas/minimap-canvas';
import { ResourceState } from '@shared/resource-state/resource-state';
import { SectionHead } from '@shared/section-head/section-head';

import { readRotation } from '../minimap/minimap-rotation.utils';
import { CompBoard } from './comp-board/comp-board';
import { HabitBoard } from './habit-board/habit-board';
import { ShareBoard } from './share-board/share-board';
import {
  compRows,
  contactRows,
  habitRows,
  pickStrategyMap,
  plantDensity,
  plantMarkers,
  rolePicks,
  siteLabels,
  siteRows,
  strategyLead,
} from './strategy.utils';

/** Colour of the top ranked plant spots, as on the Minimap view. */
const TOP_PLANT_COLOR = 'var(--color-top-plants)';

/**
 * Stratégie, one map at a time: what the top ranked play there (compos, agents by role), the habits
 * that explain their extra rounds, where they plant and where the defense meets the first duel.
 */
@Component({
  selector: 'app-strategy-view',
  imports: [
    SectionHead,
    LucideBomb,
    LucideShield,
    LucideSparkles,
    LucideTrendingUp,
    LucideUsers,
    AgentIcon,
    CompBoard,
    HabitBoard,
    MapThumb,
    MinimapCanvas,
    ResourceState,
    RoleIcon,
    RouterLink,
    ShareBoard,
  ],
  templateUrl: './strategy-view.html',
  host: { class: 'view-body' },
})
export class StrategyView {
  /** Map of the URL (`/report/strategy/Lotus`). */
  public readonly map = input<string>();

  protected readonly context = inject(ReportContext);
  private readonly api = inject(ReportApi);
  private readonly storage = inject(DOCUMENT).defaultView?.localStorage ?? null;

  private readonly meta = computed(() => resourceValue(this.context.meta, null));
  protected readonly pool = computed(() => this.meta()?.mapPool ?? []);
  protected readonly mapName = computed(() =>
    pickStrategyMap(this.map(), this.pool(), this.meta()?.maps ?? []),
  );
  protected readonly strategy = this.api.strategy(this.context.query, this.mapName);
  protected readonly periodParams = computed(() => periodQueryParams(this.context.query()));
  /** Top ranked reference of the map still too thin to read. */
  protected readonly collecting = computed(() =>
    (this.meta()?.quality.referenceMaps ?? []).find(
      (r) => r.mapName === this.mapName() && r.collecting,
    ),
  );

  private readonly view = computed(() => resourceValue(this.strategy, null));
  protected readonly splash = computed(() => {
    const src = this.mapName() ? mapSplash(this.mapName()!) : null;
    return src ? `url('${src}')` : null;
  });
  protected readonly comps = computed(() => (this.view() ? compRows(this.view()!) : []));
  protected readonly roles = computed(() => (this.view() ? rolePicks(this.view()!) : []));
  protected readonly habits = computed(() => habitRows(this.view()?.habits ?? []));
  protected readonly sites = computed(() => siteRows(this.view()?.sites ?? []));
  protected readonly contacts = computed(() => contactRows(this.view()?.contacts ?? []));
  protected readonly lead = computed(() =>
    this.view() ? strategyLead(this.view()!, this.habits()) : null,
  );
  protected readonly density = computed(() =>
    this.view() ? plantDensity(this.view()!, TOP_PLANT_COLOR) : [],
  );
  protected readonly plants = computed(() => (this.view() ? plantMarkers(this.view()!) : []));
  protected readonly labels = computed(() => (this.view() ? siteLabels(this.view()!) : []));
  protected readonly rotation = computed(() => {
    const map = this.mapName();
    return map ? readRotation(map, this.storage) : 0;
  });
}
