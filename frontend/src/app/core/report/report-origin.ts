import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import { ReportOrigin } from './report-origin.model';
import { isRoundsUrl, reportOrigin } from './report-origin.utils';

/**
 * Remembers the last report page seen outside Rounds, so a round sheet can offer to go back to it
 * (the match, the minimap, a player...). Started by the report page so no navigation is missed.
 */
@Injectable({ providedIn: 'root' })
export class ReportOriginTracker {
  private readonly last = signal<ReportOrigin | null>(null);
  public readonly origin = this.last.asReadonly();

  constructor() {
    inject(Router)
      .events.pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        if (!isRoundsUrl(e.urlAfterRedirects)) {
          this.last.set(reportOrigin(e.urlAfterRedirects));
        }
      });
  }
}
