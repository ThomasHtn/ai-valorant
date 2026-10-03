import { Component, computed, input } from '@angular/core';

import { roleIcon } from '@core/game-assets/game-assets.utils';

/** White glyph of an agent role (duelliste, contrôleur...), sized by the host's classes. */
@Component({
  selector: 'app-role-icon',
  template: `
    @if (src(); as src) {
      <img [src]="src" alt="" class="size-full object-contain opacity-85" />
    }
  `,
  host: { class: 'inline-block size-4 shrink-0', 'aria-hidden': 'true' },
})
export class RoleIcon {
  /** Role as the API names it ('Duelist'). */
  public readonly role = input.required<string>();

  protected readonly src = computed(() => roleIcon(this.role()));
}
