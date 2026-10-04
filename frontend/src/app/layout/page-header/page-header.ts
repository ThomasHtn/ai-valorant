import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Top bar of a routed page, one block on the sunken ground: the wordmark, a slash, then what the
 * page puts in scope (the report's period); an optional second row (`[appHeaderTabs]`) holds its
 * views. The wordmark opens the latest report.
 */
@Component({
  selector: 'app-page-header',
  imports: [RouterLink],
  templateUrl: './page-header.html',
  host: { class: 'block shrink-0' },
})
export class PageHeader {}
