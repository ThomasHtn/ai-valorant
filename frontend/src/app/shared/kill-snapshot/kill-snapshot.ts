import { Component, input } from '@angular/core';

import { KillSnapshot as KillSnapshotData } from '@core/sessions/session.model';

const SIZE = 360;
const CROSS = 5;

/** Every player alive right after a kill; the victim is a cross, linked to the killer. */
@Component({
  selector: 'app-kill-snapshot',
  template: `
    <svg
      [attr.viewBox]="'0 0 ' + size + ' ' + size"
      class="notch-tr w-full max-w-sm bg-surface-sunken [--notch:0.75rem]"
      role="img"
      aria-label="Positions au moment du kill"
    >
      <image
        [attr.href]="snapshot().minimapUrl"
        x="0"
        y="0"
        [attr.width]="size"
        [attr.height]="size"
        opacity="0.75"
      />
      @if (snapshot().killer; as killer) {
        <line
          [attr.x1]="killer.x * size"
          [attr.y1]="killer.y * size"
          [attr.x2]="snapshot().victim.x * size"
          [attr.y2]="snapshot().victim.y * size"
          class="stroke-brand-400"
          stroke-width="2"
        />
      }
      @for (player of snapshot().players; track player.name) {
        <circle
          [attr.cx]="player.position.x * size"
          [attr.cy]="player.position.y * size"
          r="5"
          [class.fill-squad]="player.squad"
          [class.fill-opponent]="!player.squad"
          stroke="#fff"
        />
        @if (player.squad) {
          <text
            [attr.x]="player.position.x * size + 7"
            [attr.y]="player.position.y * size + 4"
            class="fill-white text-[10px]"
            paint-order="stroke"
            stroke="#000"
            stroke-width="2"
          >
            {{ player.name }}
          </text>
        }
      }
      <path
        [attr.d]="cross()"
        stroke-width="3"
        [class.stroke-squad]="snapshot().victimSquad"
        [class.stroke-opponent]="!snapshot().victimSquad"
      />
    </svg>
  `,
})
export class KillSnapshot {
  public readonly snapshot = input.required<KillSnapshotData>();

  protected readonly size = SIZE;

  protected cross(): string {
    const x = this.snapshot().victim.x * SIZE;
    const y = this.snapshot().victim.y * SIZE;
    return `M${x - CROSS},${y - CROSS}L${x + CROSS},${y + CROSS}M${x - CROSS},${y + CROSS}L${x + CROSS},${y - CROSS}`;
  }
}
