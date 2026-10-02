import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';

import {
  SEGMENT_ACTIVE_CLASS,
  SEGMENT_CLASS,
  SEGMENT_IDLE_CLASS,
  SEGMENT_ROW_CLASS,
  TAB_NOTE_CLASS,
} from './tabs.constants';
import { LinkTabItem } from './tabs.model';

/**
 * Sections of a page that live in the URL (the team report's parts), drawn like `SegmentedTabs`.
 * The caller says which entry is selected, since a default entry has no parameter of its own.
 */
@Component({
  selector: 'app-link-tabs',
  imports: [RouterLink, LucideDynamicIcon],
  template: `
    <nav [class]="rowClass" [attr.aria-label]="label()">
      @for (item of items(); track item.id) {
        @let active = item.id === selected();
        <a
          [routerLink]="item.link"
          queryParamsHandling="preserve"
          [class]="tabClass + ' ' + (active ? activeClass : idleClass)"
          [attr.aria-current]="active ? 'page' : null"
        >
          @if (item.icon) {
            <svg class="size-4 shrink-0" [lucideIcon]="item.icon" aria-hidden="true"></svg>
          }
          {{ item.label }}
          @if (item.note) {
            <span class="font-display tabular-nums" [class]="noteClass[item.tone ?? 'neutral']">{{
              item.note
            }}</span>
          }
        </a>
      }
    </nav>
  `,
  host: { class: 'block' },
})
export class LinkTabs {
  public readonly items = input.required<LinkTabItem[]>();
  public readonly selected = input<string | null>(null);
  /** Accessible name of the navigation. */
  public readonly label = input.required<string>();

  protected readonly rowClass = SEGMENT_ROW_CLASS;
  protected readonly tabClass = SEGMENT_CLASS;
  protected readonly activeClass = SEGMENT_ACTIVE_CLASS;
  protected readonly idleClass = SEGMENT_IDLE_CLASS;
  protected readonly noteClass = TAB_NOTE_CLASS;
}
