import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import { GLOSSARY_PARAMETERS } from '@core/help/glossary-parameters.constants';
import { HELP_SECTIONS } from '@core/help/help-registry';
import { PageHeader } from '@layout/page-header/page-header';

import { searchGlossary } from './glossary.utils';

/**
 * Glossary: the fixed parameters, then every statistic by domain with the same texts as the "i"
 * tips, and a search over all of them.
 */
@Component({
  selector: 'app-glossary-page',
  imports: [PageHeader],
  host: { class: 'page-stack' },
  templateUrl: './glossary-page.html',
})
export class GlossaryPage {
  protected readonly parameters = GLOSSARY_PARAMETERS;
  protected readonly search = signal('');
  protected readonly sections = computed(() => searchGlossary(HELP_SECTIONS, this.search()));

  private readonly document = inject(DOCUMENT);

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  /** Scrolls to a section without changing the URL. */
  protected jump(id: string): void {
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
