import { NgTemplateOutlet } from '@angular/common';
import { Component, input, model } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AgentIcon } from '@shared/game-art/agent-icon';

import {
  AVATAR_ACTIVE_CLASS,
  AVATAR_CLASS,
  AVATAR_IDLE_CLASS,
  BANNER_ACTIVE_CLASS,
  BANNER_CLASS,
  BANNER_IDLE_CLASS,
  PICKER_ROW_CLASS,
  TAB_NOTE_CLASS,
} from './tabs.constants';
import { PickerItem, PickerLook } from './tabs.model';

/**
 * First level inside a page: which map, player or match. Entries are pictures (map banners, agent
 * portraits) so they never read as the section tabs under them.
 */
@Component({
  selector: 'app-picker-tabs',
  imports: [RouterLink, NgTemplateOutlet, AgentIcon],
  template: `
    <nav [class]="rowClass" [attr.aria-label]="label()">
      @for (item of items(); track item.id) {
        @let active = item.id === selected();
        @let cls = classes(active);
        @if (item.link) {
          <a
            [routerLink]="item.link"
            queryParamsHandling="preserve"
            [class]="cls"
            [attr.aria-current]="active ? 'page' : null"
          >
            <ng-container *ngTemplateOutlet="content; context: { $implicit: item, active }" />
          </a>
        } @else {
          <button
            type="button"
            [class]="cls"
            [attr.aria-pressed]="active"
            (click)="selected.set(item.id)"
          >
            <ng-container *ngTemplateOutlet="content; context: { $implicit: item, active }" />
          </button>
        }
      }
    </nav>

    <ng-template #content let-item let-active="active">
      @if (look() === 'banner') {
        @if (item.image) {
          <img
            [src]="item.image"
            alt=""
            class="absolute inset-0 -z-10 size-full object-cover transition-opacity duration-200 motion-reduce:transition-none"
            [class]="active ? 'opacity-90' : 'opacity-40 group-hover/pick:opacity-70'"
          />
        }
        <span
          class="absolute inset-0 -z-10 bg-linear-to-t from-surface-950/90 via-surface-950/30 to-transparent"
          aria-hidden="true"
        ></span>
        <span class="font-display text-base leading-none font-semibold text-text-primary">{{
          item.label
        }}</span>
        @if (item.note) {
          <span
            class="font-display text-sm leading-none font-semibold tabular-nums"
            [class]="noteClassOf(item)"
            >{{ item.note }}</span
          >
        }
      } @else {
        @if (item.agent) {
          <app-agent-icon [agent]="item.agent" size="md" />
        }
        {{ item.label }}
        @if (item.note) {
          <span class="font-display tabular-nums" [class]="noteClassOf(item)">{{ item.note }}</span>
        }
      }
    </ng-template>
  `,
  host: { class: 'block' },
})
export class PickerTabs {
  public readonly items = input.required<PickerItem[]>();
  public readonly selected = model<string | null>(null);
  public readonly look = input<PickerLook>('banner');
  /** Accessible name of the picker. */
  public readonly label = input.required<string>();

  protected readonly rowClass = PICKER_ROW_CLASS;

  /** Typed here because the shared template's context is not. */
  protected noteClassOf(item: PickerItem): string {
    return TAB_NOTE_CLASS[item.tone ?? 'neutral'];
  }

  protected classes(active: boolean): string {
    return this.look() === 'banner'
      ? `${BANNER_CLASS} ${active ? BANNER_ACTIVE_CLASS : BANNER_IDLE_CLASS}`
      : `${AVATAR_CLASS} ${active ? AVATAR_ACTIVE_CLASS : AVATAR_IDLE_CLASS}`;
  }
}
