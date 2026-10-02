import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageHeader } from '@layout/page-header/page-header';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, PageHeader],
  template: `
    <app-page-header heading="Page introuvable" />
    <div class="page-body">
      <div>
        <p class="text-lead text-text-secondary">
          Cette adresse ne correspond à aucun rapport.
          <a routerLink="/">Retour à l'accueil</a>
        </p>
      </div>
    </div>
  `,
  host: { class: 'page-stack' },
})
export class NotFound {}
