import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { RewatchRound } from '@core/report/findings.model';

import { rewatchGroups } from './rewatch-links.utils';

/**
 * 'À revoir : 30/09 Split R13 R14  28/09 Lotus R5': the rounds behind a figure grouped by match.
 * The match label opens the match, each round chip its sheet, with the period kept in the URL.
 */
@Component({
  selector: 'app-rewatch-links',
  imports: [RouterLink],
  template: `
    @if (groups().length) {
      @if (label()) {
        <span class="text-text-muted">{{ label() }}</span>
      }
      @for (group of groups(); track group.key) {
        <span class="inline-flex items-center gap-1 whitespace-nowrap">
          <a
            class="focus-ring mr-0.5 !text-text-secondary no-underline hover:!text-text-primary hover:underline"
            [routerLink]="group.commands"
            queryParamsHandling="preserve"
            >{{ group.label }}</a
          >
          @for (round of group.rounds; track round.key) {
            <a
              class="focus-ring bg-brand-500/12 px-1.5 text-[0.85rem] leading-6 font-semibold tabular-nums no-underline transition-colors hover:bg-brand-500/25"
              [routerLink]="round.commands"
              queryParamsHandling="preserve"
              [attr.aria-label]="group.label + ', round ' + round.label.slice(1)"
              >{{ round.label }}</a
            >
          }
        </span>
      }
    }
  `,
  host: { class: 'flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[0.92rem]' },
})
export class RewatchLinks {
  public readonly rounds = input.required<RewatchRound[]>();
  /** Lead-in text, e.g. 'À revoir :'; none by default. */
  public readonly label = input<string>('');
  public readonly max = input(6);

  protected readonly groups = computed(() => rewatchGroups(this.rounds(), this.max()));
}
