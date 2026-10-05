import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideBomb,
  LucideCircleCheck,
  LucideCoins,
  LucideFlame,
  LucideMap,
  LucideShield,
  LucideSwords,
  LucideUsers,
} from '@lucide/angular';

import { resourceValue } from '@core/http/resource-state.utils';
import { PRIORITIES_SHOWN } from '@core/report/gap.constants';
import { byCost } from '@core/report/gap.utils';
import { ReportApi } from '@core/report/report-api';
import { ReportContext } from '@core/report/report-context';
import { KpiBand } from '@shared/kpi-band/kpi-band';
import { ResourceState } from '@shared/resource-state/resource-state';
import { SectionHead } from '@shared/section-head/section-head';

import { GapBoard } from './gap-board/gap-board';
import { MapBoard } from './map-board/map-board';
import { RosterBoard } from './roster-board/roster-board';
import { SQUAD_SECTIONS } from './squad.constants';
import {
  conclusion,
  kpiItems,
  mapRows,
  priorities,
  siteRow,
  situationRow,
  strengths,
  topLine,
} from './squad.utils';

/**
 * Escouade: the period in one sentence, its headline figures, then what costs rounds against the
 * top ranked (overall and map by map), what works, the maps, the four key phases and the roster.
 */
@Component({
  selector: 'app-squad-view',
  imports: [
    GapBoard,
    KpiBand,
    LucideBomb,
    LucideCircleCheck,
    LucideCoins,
    LucideFlame,
    LucideMap,
    LucideShield,
    LucideSwords,
    LucideUsers,
    MapBoard,
    ResourceState,
    RosterBoard,
    RouterLink,
    SectionHead,
  ],
  templateUrl: './squad-view.html',
  host: { class: 'view-body' },
})
export class SquadView {
  protected readonly context = inject(ReportContext);
  private readonly api = inject(ReportApi);

  protected readonly squad = this.api.squad(this.context.query);
  protected readonly sections = SQUAD_SECTIONS;
  protected readonly allPriorities = signal(false);

  private readonly view = computed(() => resourceValue(this.squad, null));
  protected readonly meta = computed(() => resourceValue(this.context.meta, null));
  protected readonly matches = computed(() => this.meta()?.matches ?? 0);
  /** Maps of the per-map strips: the pool maps the squad played, alphabetical. */
  protected readonly maps = computed(() => this.view()?.maps.map((m) => m.mapName) ?? []);

  protected readonly kpis = computed(() => {
    const view = this.view();
    return view ? kpiItems(view) : [];
  });
  protected readonly mapRows = computed(() =>
    mapRows(this.view()?.maps ?? [], this.meta()?.quality.referenceMaps ?? []),
  );
  protected readonly lead = computed(() => {
    const view = this.view();
    return view ? conclusion(view, this.mapRows()) : null;
  });
  private readonly priorityRows = computed(() => priorities(this.view()?.situations ?? []));
  protected readonly hiddenPriorities = computed(() =>
    Math.max(0, this.priorityRows().length - PRIORITIES_SHOWN),
  );
  protected readonly shownPriorities = computed(() =>
    this.allPriorities() ? this.priorityRows() : this.priorityRows().slice(0, PRIORITIES_SHOWN),
  );
  protected readonly strengthRows = computed(() => strengths(this.view()?.situations ?? []));
  protected readonly priorityLine = computed(() => topLine(this.priorityRows(), 'La plus chère'));
  protected readonly strengthLine = computed(() => topLine(this.strengthRows(), 'La meilleure'));
  protected readonly mapLine = computed(() => {
    const worst = this.mapRows().find((m) => m.verdict === 'work');
    return worst
      ? `${worst.map} est la carte à travailler (${worst.rounds} rounds)`
      : "Où mettre l'entraînement, la carte la plus coûteuse en haut";
  });
  protected readonly economy = computed(() => this.group('economy'));
  protected readonly opening = computed(() => this.group('opening'));
  protected readonly postPlant = computed(() =>
    byCost(this.view()?.postPlant ?? [], (s) => s.gap).map(siteRow),
  );
  protected readonly retakes = computed(() =>
    byCost(this.view()?.retakes ?? [], (s) => s.gap).map(siteRow),
  );
  /** Pool maps whose top ranked reference is still too thin to compare. */
  protected readonly collecting = computed(() =>
    (this.meta()?.quality.referenceMaps ?? []).filter((r) => r.collecting),
  );

  protected jump(id: string): void {
    document.getElementById(id)?.scrollIntoView({ block: 'start' });
  }

  private group(key: 'economy' | 'opening') {
    return (this.view()?.situations ?? []).filter((s) => s.group === key).map(situationRow);
  }
}
