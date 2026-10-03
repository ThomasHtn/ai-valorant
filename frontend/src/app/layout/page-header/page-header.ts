import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** The two global screens of the top bar; report pages are opened from the home page. */
const LINKS = [
  { path: '/', label: 'Accueil', exact: true },
  { path: '/glossary', label: 'Glossaire', exact: false },
] as const;

/**
 * Top bar of a routed page: the wordmark linking home, the global navigation, an optional title,
 * then projected content on the right (e.g. the data freshness).
 */
@Component({
  selector: 'app-page-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './page-header.html',
  host: { class: 'block shrink-0' },
})
export class PageHeader {
  public readonly heading = input<string | null>(null);

  protected readonly links = LINKS;
}
