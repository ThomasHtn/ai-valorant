import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import {
  LucideBookOpen,
  LucideCalendarClock,
  LucideDynamicIcon,
  LucideHouse,
  LucideX,
} from '@lucide/angular';
import { filter, map } from 'rxjs';

import { fullDate } from '@core/format/format.utils';
import { resourceValue } from '@core/http/resource-state.utils';
import { PeriodContext } from '@core/periods/period-context';
import { periodQueryParams } from '@core/periods/period-query.utils';
import { ReferenceApi } from '@core/reference/reference-api';
import { SessionsApi } from '@core/sessions/sessions-api';
import { NavigationPanel } from '@layout/navigation/navigation-panel';

import {
  NAV_HINT_CLASS,
  NAV_REPORT_ROW_CLASS,
  NAV_ROW_ACTIVE_CLASS,
  NAV_ROW_CLASS,
} from './sidebar.constants';
import { latestSessionLeaf, periodEntries } from './sidebar.utils';

/**
 * Flat navigation, one entry per screen, each with a line saying what it shows: home, evenings,
 * the pages of the report being read (grouped under its name, so the reader always knows which
 * period they are in) and the glossary. Maps, players and report parts are picked inside the page.
 * A column beside the page on desktop, a drawer over it below `lg`.
 */
@Component({
  selector: 'app-sidebar',
  imports: [
    RouterLink,
    LucideDynamicIcon,
    LucideX,
    LucideHouse,
    LucideCalendarClock,
    LucideBookOpen,
  ],
  templateUrl: './sidebar.html',
  host: { class: 'contents', '(document:keydown.escape)': 'nav.close()' },
})
export class Sidebar {
  protected readonly nav = inject(NavigationPanel);

  private readonly router = inject(Router);
  private readonly status = inject(ReferenceApi).status;
  private readonly sessions = inject(SessionsApi).list;
  private readonly period = inject(PeriodContext);

  protected readonly rowClass = NAV_ROW_CLASS;
  protected readonly rowActiveClass = NAV_ROW_ACTIVE_CLASS;
  protected readonly reportRowClass = NAV_REPORT_ROW_CLASS;
  protected readonly hintClass = NAV_HINT_CLASS;

  /** Path of the current page, without its query. */
  protected readonly path = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.currentPath()),
    ),
    { initialValue: this.currentPath() },
  );

  protected readonly onHome = computed(() => this.path() === '/');
  protected readonly onSessions = computed(() => this.path().startsWith('/sessions'));
  protected readonly onGlossary = computed(() => this.path().startsWith('/periods/glossary'));

  protected readonly latestSession = computed(() =>
    latestSessionLeaf(resourceValue(this.sessions, []) ?? []),
  );

  private readonly overview = computed(() => resourceValue(this.period.overview, null) ?? null);

  protected readonly periodEntries = computed(() => periodEntries(this.path(), this.overview()));

  /** Name and size of the report being read, heading its pages. */
  protected readonly periodTitle = computed(() => this.overview()?.title ?? null);
  protected readonly periodMatches = computed(() => this.overview()?.matches ?? null);

  /** Period being read, kept by every report link (the glossary included). */
  protected readonly periodParams = computed(() => periodQueryParams(this.period.query()));

  protected readonly latestMatch = computed(() => {
    const squad = resourceValue(this.status, null)?.sources.find((s) => s.source === 'squad');
    return squad?.latestMatch ? fullDate(squad.latestMatch) : null;
  });

  private currentPath(): string {
    return this.router.url.split(/[?#]/)[0];
  }
}
