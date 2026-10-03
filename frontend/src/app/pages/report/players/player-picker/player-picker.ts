import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PlayerSummary } from '@core/report/players.model';
import { AgentIcon } from '@shared/game-art/agent-icon';
import { RoleIcon } from '@shared/game-art/role-icon';

import { roleLabel } from '../players.utils';

/** Squad players of the period as portrait buttons (avatar agent, name, role and its icon); each opens his sheet. */
@Component({
  selector: 'app-player-picker',
  imports: [RouterLink, AgentIcon, RoleIcon],
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
              : 'border-transparent bg-text-primary/4 !text-text-secondary hover:border-brand-500/45 hover:bg-text-primary/10 hover:!text-text-primary'
          "
          [attr.aria-current]="active ? 'page' : null"
        >
          <app-agent-icon [agent]="item.portrait" size="md" [decorative]="true" />
          <span class="flex flex-col leading-tight">
            <b class="font-semibold">{{ item.name }}</b>
            <small class="flex items-center gap-1 text-xs text-text-muted">
              <app-role-icon class="!size-3.5" [role]="item.roleKey" />{{ item.role }}
            </small>
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
    this.players().map((p) => ({
      name: p.name,
      portrait: p.portrait,
      roleKey: p.role,
      role: roleLabel(p.role),
    })),
  );
}
