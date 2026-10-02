import { Component, computed, input } from '@angular/core';

import { agentIcon } from '@core/game-assets/game-assets.utils';

import { AGENT_ICON_SIZES, GAME_ART_FRAME_CLASS } from './game-art.constants';
import { GameArtSize } from './game-art.model';

/** Agent portrait in a cut square, no frame; the agent's initial when no image is known. */
@Component({
  selector: 'app-agent-icon',
  template: `
    @if (src(); as src) {
      <img
        [src]="src"
        [alt]="decorative() ? '' : agent()"
        [title]="agent()"
        loading="lazy"
        class="size-full object-cover"
      />
    } @else {
      <span
        class="font-display text-sm font-semibold text-text-secondary"
        [attr.aria-hidden]="decorative()"
        >{{ agent().charAt(0) }}</span
      >
    }
  `,
  host: { '[class]': 'hostClass()' },
})
export class AgentIcon {
  public readonly agent = input.required<string>();
  public readonly size = input<GameArtSize>('sm');
  /** True when the agent's name is written next to the portrait. */
  public readonly decorative = input(false);

  protected readonly src = computed(() => agentIcon(this.agent()));
  protected readonly hostClass = computed(
    () => `${GAME_ART_FRAME_CLASS} ${AGENT_ICON_SIZES[this.size()]}`,
  );
}
