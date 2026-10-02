import { Component, inject, input } from '@angular/core';
import { LucideMenu } from '@lucide/angular';

import { NavigationPanel } from '@layout/navigation/navigation-panel';

/**
 * Top bar of a routed page: the title (or a `[pageTitle]` element in its place), then projected
 * content on the right.
 */
@Component({
  selector: 'app-page-header',
  imports: [LucideMenu],
  templateUrl: './page-header.html',
  host: { class: 'block shrink-0' },
})
export class PageHeader {
  public readonly heading = input<string | null>(null);

  protected readonly nav = inject(NavigationPanel);
}
