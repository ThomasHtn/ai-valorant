import { Component, DestroyRef, ElementRef, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  LucideBomb,
  LucideChartLine,
  LucideCircleCheck,
  LucideCoins,
  LucideFlame,
  LucideGrid2x2,
  LucideMap,
  LucideRotateCcw,
  LucideShieldCheck,
  LucideSwords,
  LucideUsers,
} from '@lucide/angular';

import { resourceValue } from '@core/http/resource-state.utils';
import { CardHead } from '@shared/card-head/card-head';
import { Donut } from '@shared/donut/donut';
import { InfoTip } from '@shared/info-tip/info-tip';
import { MonthChart } from '@shared/month-chart/month-chart';
import { ResourceState } from '@shared/resource-state/resource-state';
import { ReportApi } from '@core/report/report-api';
import { ReportContext } from '@core/report/report-context';

import { defenseSeries, monthTicks, ringKpis, trendSeries } from './bilan.utils';
import { HabitBoard } from './habit-board/habit-board';
import { habitRows } from './habit.utils';
import { MapBoard } from './map-board/map-board';
import { SIDE_COLORS } from './map-board/map-board.constants';
import { RingCard } from './ring-card/ring-card';
import { RosterBoard } from './roster-board/roster-board';
import { SituationTable } from './situation-table/situation-table';
import { SpikeBoard } from './spike-board/spike-board';
import { LOST_COLORS, SECTION_READ_OFFSET, SQUAD_SECTIONS } from './squad.constants';
import {
  buyShares,
  economyLines,
  lostSplit,
  openingLines,
  priorities,
  priorityList,
  strengths,
} from './situation.utils';

/**
 * Escouade as a dashboard: four headline rings, the months behind them, how rounds are lost, then
 * what costs and what pays against the top ranked, the maps, the economy, the openings, the spike
 * and the roster, each in its card and picked from a side list.
 */
@Component({
  selector: 'app-squad-view',
  imports: [
    CardHead,
    Donut,
    InfoTip,
    LucideBomb,
    LucideChartLine,
    LucideCircleCheck,
    LucideCoins,
    LucideFlame,
    LucideGrid2x2,
    LucideMap,
    LucideRotateCcw,
    LucideShieldCheck,
    LucideSwords,
    LucideUsers,
    HabitBoard,
    MapBoard,
    MonthChart,
    ResourceState,
    RingCard,
    RosterBoard,
    RouterLink,
    SituationTable,
    SpikeBoard,
  ],
  templateUrl: './squad-view.html',
  host: { class: 'view-body' },
})
export class SquadView {
  protected readonly context = inject(ReportContext);
  private readonly api = inject(ReportApi);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);

  protected readonly squad = this.api.squad(this.context.query);
  protected readonly sections = SQUAD_SECTIONS;
  /** Section under the reader's eye, lit in the side list. */
  protected readonly activeSection = signal(SQUAD_SECTIONS[0].id);
  protected readonly sideColors = SIDE_COLORS;
  protected readonly lostColors = LOST_COLORS;

  protected readonly view = computed(() => resourceValue(this.squad, null));
  protected readonly meta = computed(() => resourceValue(this.context.meta, null));
  protected readonly matches = computed(() => this.meta()?.matches ?? 0);
  private readonly situations = computed(() => this.view()?.situations ?? []);

  /** 'avant septembre', after each headline change. */
  protected readonly since = computed(() => {
    const label = this.context.historyLabel();
    return label.charAt(0).toLowerCase() + label.slice(1);
  });
  protected readonly rings = computed(() => {
    const view = this.view();
    return view ? ringKpis(view) : [];
  });
  protected readonly ticks = computed(() => monthTicks(this.view()?.months ?? []));
  protected readonly trend = computed(() => {
    const view = this.view();
    return view ? trendSeries(view) : [];
  });
  protected readonly monthLabels = computed(() => (this.view()?.months ?? []).map((m) => m.label));
  /** 'de mai à septembre', the span of the month charts. */
  protected readonly monthSpan = computed(() => {
    const months = this.view()?.months ?? [];
    return months.length
      ? `de ${months[0].label.toLowerCase()} à ${months[months.length - 1].label.toLowerCase()}`
      : '';
  });

  protected readonly lost = computed(() => lostSplit(this.situations()));
  protected readonly lostSlices = computed(() => {
    const lost = this.lost();
    return lost
      ? [
          { key: 'after-death', value: lost.afterDeath, color: LOST_COLORS.afterDeath },
          { key: 'despite-blood', value: lost.despiteBlood, color: LOST_COLORS.despiteBlood },
        ]
      : [];
  });

  protected readonly priorities = computed(() => priorities(this.situations()));
  protected readonly habits = computed(() => habitRows(priorityList(this.situations())));
  protected readonly strengths = computed(() => strengths(this.situations()));

  protected readonly played = computed(() => this.view()?.kpis.rounds.n ?? 0);
  protected readonly economy = computed(() => economyLines(this.situations()));
  protected readonly shares = computed(() => buyShares(this.situations(), this.played()));
  protected readonly shareSlices = computed(() =>
    this.shares().map((s) => ({ key: s.key, value: s.rounds, color: s.color })),
  );

  protected readonly opening = computed(() => openingLines(this.situations()));
  protected readonly duelDefense = computed(
    () => this.situations().find((s) => s.key === 'duel-defense') ?? null,
  );
  protected readonly defense = computed(() => {
    const view = this.view();
    return view ? defenseSeries(view) : [];
  });

  protected readonly postPlant = computed(
    () => this.situations().find((s) => s.key === 'post-plant') ?? null,
  );
  protected readonly retake = computed(
    () => this.situations().find((s) => s.key === 'retake') ?? null,
  );

  protected readonly references = computed(() => this.meta()?.quality.referenceMaps ?? []);
  /** Pool maps whose top ranked reference is still too thin to compare. */
  protected readonly collecting = computed(() => this.references().filter((r) => r.collecting));

  constructor() {
    // Scroll events do not bubble, so listen while capturing: the scroller can be re-created
    // after this view renders, and a listener bound to it then would go stale.
    const onScroll = (event: Event) => {
      const scroller = event.target;
      if (scroller instanceof Element && scroller.contains(this.host.nativeElement)) {
        this.activeSection.set(this.sectionInView(scroller));
      }
    };
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    inject(DestroyRef).onDestroy(() =>
      document.removeEventListener('scroll', onScroll, { capture: true }),
    );
  }

  /** A month of the charts opens its sessions: the period becomes that month. */
  protected openMonth(month: string): void {
    void this.router.navigate(['/report/sessions'], { queryParams: { month } });
  }

  protected jump(id: string): void {
    document.getElementById(id)?.scrollIntoView({ block: 'start' });
    this.activeSection.set(id);
  }

  /** Last section whose top has passed the reading line; the last one once the page bottoms out. */
  private sectionInView(scroller: Element): string {
    if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2) {
      return this.sections[this.sections.length - 1].id;
    }
    const line = scroller.getBoundingClientRect().top + SECTION_READ_OFFSET;
    let current = this.sections[0].id;
    for (const section of this.sections) {
      const top = document.getElementById(section.id)?.getBoundingClientRect().top;
      if (top !== undefined && top <= line) {
        current = section.id;
      }
    }
    return current;
  }
}
