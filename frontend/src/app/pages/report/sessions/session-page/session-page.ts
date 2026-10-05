import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';

import { monthTitle } from '@core/format/format.utils';
import { resourceValue } from '@core/http/resource-state.utils';
import { PeriodQuery } from '@core/report/period-query.model';
import { ReportApi } from '@core/report/report-api';
import { ReportContext } from '@core/report/report-context';
import { roundLink } from '@core/report/round-ref.utils';
import { Breadcrumb } from '@shared/breadcrumb/breadcrumb';
import { Crumb } from '@shared/breadcrumb/breadcrumb.model';
import { ColHead } from '@shared/col-head/col-head';
import { AgentIcon } from '@shared/game-art/agent-icon';
import { MapThumb } from '@shared/game-art/map-thumb';
import { GapBar } from '@shared/gap-bar/gap-bar';
import { KpiBand } from '@shared/kpi-band/kpi-band';
import { MapBanner } from '@shared/map-banner/map-banner';
import { ResourceState } from '@shared/resource-state/resource-state';

import { playerForms, turningRounds } from '../../debrief/debrief.utils';
import { sessionKpis, sessionLead, sessionMatchRows, sessionTitle } from '../sessions.utils';

/**
 * One session against the rest of its month: its answer in one sentence, its headline band, the
 * rounds that tipped, its players, then its matches; a match opens its scoreboards and its rounds.
 */
@Component({
  selector: 'app-session-page',
  imports: [AgentIcon, Breadcrumb, ColHead, GapBar, KpiBand, MapBanner, MapThumb, ResourceState],
  templateUrl: './session-page.html',
  host: { class: 'view-body' },
})
export class SessionPage {
  /** Day of the session (`/report/sessions/2026-09-27`). */
  public readonly day = input.required<string>();

  private readonly context = inject(ReportContext);
  private readonly api = inject(ReportApi);
  private readonly router = inject(Router);

  /** The session is always read inside its own month. */
  private readonly monthQuery = computed<PeriodQuery>(() => ({ month: this.day().slice(0, 7) }));
  protected readonly monthName = computed(() =>
    monthTitle(this.day().slice(0, 7)).split(' ')[0].toLowerCase(),
  );
  protected readonly list = this.api.matches(this.monthQuery);
  private readonly rounds = this.api.rounds(this.monthQuery);

  private readonly pool = computed(
    () => new Set(resourceValue(this.context.meta, null)?.mapPool ?? []),
  );
  private readonly evening = computed(() =>
    (resourceValue(this.list, null)?.evenings ?? []).find((e) => e.day === this.day()),
  );
  protected readonly title = computed(() => sessionTitle(this.day()));
  private readonly monthRounds = computed(() => resourceValue(this.rounds, null)?.rounds ?? []);
  private readonly sessionRounds = computed(() =>
    this.monthRounds().filter((r) => r.day === this.day()),
  );
  protected readonly matches = computed(() => this.evening()?.matches ?? []);
  protected readonly record = computed(() => ({
    wins: this.evening()?.wins ?? 0,
    losses: this.evening()?.losses ?? 0,
  }));

  protected readonly crumbs = computed<Crumb[]>(() => [
    { label: 'Sessions', link: ['/report/sessions'] },
    { label: this.title(), link: null },
  ]);
  protected readonly lead = computed(() =>
    sessionLead(this.sessionRounds(), this.monthRounds(), this.matches(), this.monthName()),
  );
  protected readonly kpis = computed(() =>
    sessionKpis(this.sessionRounds(), this.monthRounds(), this.matches(), this.monthName()),
  );
  protected readonly turning = computed(() =>
    turningRounds(this.sessionRounds()).map((r) => ({ ...r, link: roundLink(r) })),
  );
  protected readonly players = computed(() => {
    const evening = this.evening();
    return evening ? playerForms([evening], resourceValue(this.list, null)?.evenings ?? []) : [];
  });
  protected readonly matchRows = computed(() =>
    sessionMatchRows(this.matches(), this.sessionRounds(), this.pool()),
  );
  protected readonly offPool = computed(() => this.matchRows().filter((m) => m.offPool).length);

  protected openMatch(matchId: string): void {
    void this.router.navigate(['/report/matches', matchId], {
      queryParams: { month: this.day().slice(0, 7) },
    });
  }

  protected openRound(link: string[]): void {
    void this.router.navigate(link, { queryParams: { month: this.day().slice(0, 7) } });
  }

  protected readonly Math = Math;

  protected signed(gap: number | null): string {
    return gap === null ? '' : `${gap > 0 ? '+' : gap < 0 ? '−' : ''}${Math.abs(Math.round(gap))}`;
  }
}
