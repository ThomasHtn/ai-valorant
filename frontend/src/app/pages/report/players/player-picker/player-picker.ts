import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PlayerSummary } from '@core/report/players.model';
import { AgentIcon } from '@shared/game-art/agent-icon';

import { roleLabel } from '../players.utils';

/** Squad players of the period as portrait buttons (main agent, name, role); each opens his sheet. */
@Component({
  selector: 'app-player-picker',
  imports: [RouterLink, AgentIcon],
  template: `
    <nav class="flex flex-wrap gap-0.5" aria-label="Joueur">
      @for (item of items(); track item.name) {
        @let active = item.name === selected();
        <a
          [routerLink]="['/report/players', item.name]"
          queryParamsHandling="preserve"
          class="focus-ring-inset flex items-center gap-2 border-b-[3px] py-1 pr-3 pl-1 no-underline transition-colors"
          [class]="
            active
              ? 'border-brand-500 bg-text-primary/7 !text-text-primary'
              : 'border-transparent bg-text-primary/4 !text-text-secondary hover:bg-text-primary/7 hover:!text-text-primary'
          "
          [attr.aria-current]="active ? 'page' : null"
        >
          <app-agent-icon [agent]="item.mainAgent" size="md" [decorative]="true" />
          <span class="flex flex-col leading-tight">
            <b class="font-semibold">{{ item.name }}</b>
            <small class="text-[0.82rem] text-text-muted">{{ item.role }}</small>
          </span>
        </a>
      }
    </nav>
  `,
  host: { class: 'block' },
})
export class PlayerPicker {
  public readonly players = input.required<PlayerSummary[]>();
  /** Name of the player whose sheet is open. */
  public readonly selected = input<string | null>(null);

  protected readonly items = computed(() =>
    this.players().map((p) => ({ name: p.name, mainAgent: p.mainAgent, role: roleLabel(p.role) })),
  );
}
