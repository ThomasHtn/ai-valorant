import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageHeader } from '@layout/page-header/page-header';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, PageHeader],
  template: `
    <app-page-header>
      <h1 class="!m-0 truncate font-display text-xl leading-none font-medium">Page introuvable</h1>
    </app-page-header>
    <div class="page-body !pt-6">
      <div>
        <p class="text-lead text-text-secondary">
          Cette adresse ne correspond à aucun rapport.
          <a routerLink="/">Ouvrir le dernier rapport</a>
        </p>
      </div>
    </div>
  `,
  host: { class: 'page-stack' },
})
export class NotFound {}
