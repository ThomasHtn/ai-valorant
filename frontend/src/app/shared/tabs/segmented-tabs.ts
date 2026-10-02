import { Component, input, model } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

import {
  SEGMENT_ACTIVE_CLASS,
  SEGMENT_CLASS,
  SEGMENT_IDLE_CLASS,
  SEGMENT_ROW_CLASS,
  TAB_NOTE_CLASS,
} from './tabs.constants';
import { TabItem } from './tabs.model';

/** Sections of a sheet (map, player) switched without changing the URL, as a full-width tab bar. */
@Component({
  selector: 'app-segmented-tabs',
  imports: [LucideDynamicIcon],
  template: `
    <div [class]="rowClass" role="tablist" [attr.aria-label]="label()">
      @for (item of items(); track item.id) {
        @let active = item.id === selected();
        <button
          type="button"
          role="tab"
          [class]="tabClass + ' ' + (active ? activeClass : idleClass)"
          [attr.aria-selected]="active"
          (click)="selected.set(item.id)"
        >
          @if (item.icon) {
            <svg class="size-[1.125rem] shrink-0" [lucideIcon]="item.icon" aria-hidden="true"></svg>
          }
          {{ item.label }}
          @if (item.note) {
            <span class="font-display tabular-nums" [class]="noteClass[item.tone ?? 'neutral']">{{
              item.note
            }}</span>
          }
        </button>
      }
    </div>
  `,
  host: { class: 'block' },
})
export class SegmentedTabs {
  public readonly items = input.required<TabItem[]>();
  public readonly selected = model.required<string>();
  /** Accessible name of the tab list. */
  public readonly label = input.required<string>();

  protected readonly rowClass = SEGMENT_ROW_CLASS;
  protected readonly tabClass = SEGMENT_CLASS;
  protected readonly activeClass = SEGMENT_ACTIVE_CLASS;
  protected readonly idleClass = SEGMENT_IDLE_CLASS;
  protected readonly noteClass = TAB_NOTE_CLASS;
}
