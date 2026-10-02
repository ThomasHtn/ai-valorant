import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Top bar of a routed page: the wordmark linking home, the title (or a `[pageTitle]` element in its
 * place), optional `[pageTabs]`, then projected content on the right.
 */
@Component({
  selector: 'app-page-header',
  imports: [RouterLink],
  templateUrl: './page-header.html',
  host: { class: 'block shrink-0' },
})
export class PageHeader {
  public readonly heading = input<string | null>(null);
}
