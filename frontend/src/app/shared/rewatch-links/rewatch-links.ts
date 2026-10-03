import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { RewatchRound } from '@core/report/findings.model';

import { rewatchLinks } from './rewatch-links.utils';

/**
 * 'À revoir : 30/09 Split R14, 28/09 Lotus R5': the rounds behind a figure, each opening its sheet
 * with the period kept in the URL.
 */
@Component({
  selector: 'app-rewatch-links',
  imports: [RouterLink],
  template: `
    @if (links().length) {
      @if (label()) {
        <span class="text-text-muted">{{ label() }} </span>
      }
      @for (link of links(); track link.key) {
        <a [routerLink]="link.commands" queryParamsHandling="preserve">{{ link.label }}</a
        >{{ $last ? '' : ', ' }}
      }
    }
  `,
  host: { class: 'text-[0.92rem]' },
})
export class RewatchLinks {
  public readonly rounds = input.required<RewatchRound[]>();
  /** Lead-in text, e.g. 'À revoir :'; none by default. */
  public readonly label = input<string>('');
  public readonly max = input(6);

  protected readonly links = computed(() => rewatchLinks(this.rounds(), this.max()));
}
