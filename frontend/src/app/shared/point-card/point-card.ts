import { Component, computed, input } from '@angular/core';

import { BadgeContent } from '@core/common/badge.model';
import { Tone } from '@core/common/enums.model';
import { RewatchGroup } from '@core/periods/findings.model';
import { Badge } from '@shared/badge/badge';
import { MapThumb } from '@shared/game-art/map-thumb';

/**
 * A finding as one compact row: the map's preview on the left, the title with the figure and status
 * on the right, then where it happens, the comparison and the rounds to rewatch folded away.
 */
@Component({
  selector: 'app-point-card',
  imports: [Badge, MapThumb],
  template: `
    <!-- The map is named on the second line too, so a phone can drop the preview for room. -->
    @if (map(); as map) {
      <span class="mt-0.5 hidden shrink-0 sm:block">
        <app-map-thumb [map]="map" size="md" />
      </span>
    }
    <div class="min-w-0 flex-1">
      <div class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4">
        <p class="min-w-0 font-semibold text-text-primary">{{ title() }}</p>
        <span class="flex items-center gap-3">
          @if (value()) {
            <span
              class="font-display text-xl leading-none font-semibold whitespace-nowrap tabular-nums"
              [class.good]="tone() === 'good'"
              [class.bad]="tone() === 'bad'"
              >{{ value() }}</span
            >
          }
          @if (status(); as s) {
            <app-badge [label]="s.label" [kind]="s.kind" size="sm" />
          }
        </span>
      </div>
      <!-- Where it happens (map, side, players), then the comparison and the rounds to rewatch. -->
      @if (map() || scope().length || meta() || rewatchCount()) {
        <div
          class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm leading-snug text-text-muted"
        >
          @if (map(); as map) {
            <span class="font-semibold text-text-secondary">{{ map }}</span>
          }
          @for (badge of scope(); track $index) {
            <app-badge [label]="badge.label" [kind]="badge.kind" size="sm" />
          }
          @if (meta()) {
            <span>{{ meta() }}</span>
          }
          @if (rewatchCount()) {
            <details class="group/rw">
              <summary
                class="focus-ring inline cursor-pointer list-none text-brand-400 hover:text-brand-300 [&::-webkit-details-marker]:hidden"
              >
                <span
                  class="inline-block transition-transform group-open/rw:rotate-90 motion-reduce:transition-none"
                  aria-hidden="true"
                  >›</span
                >
                {{ rewatchCount() }} {{ rewatchCount() > 1 ? 'rounds' : 'round' }} à revoir
              </summary>
              <ul class="mt-1 flex flex-col gap-0.5">
                @for (group of rewatch(); track $index) {
                  <li>
                    @if (group.who) {
                      <span class="font-semibold text-text-secondary">{{ group.who }} :</span>
                    }
                    {{ group.rounds.join(', ') }}
                  </li>
                }
              </ul>
            </details>
          }
        </div>
      }
    </div>
  `,
  host: {
    class:
      'mb-1 flex items-start gap-3 rounded-r-md border-l-2 border-edge-strong bg-text-primary/4 px-4 py-2.5',
    '[class.!border-l-rating-good]': "tone() === 'good'",
    '[class.!border-l-rating-bad]': "tone() === 'bad'",
  },
})
export class PointCard {
  public readonly badges = input<BadgeContent[]>([]);
  public readonly status = input<BadgeContent | null>(null);
  public readonly title = input.required<string>();
  public readonly value = input<string | null>(null);
  public readonly details = input<(string | null)[]>([]);
  public readonly rewatch = input<RewatchGroup[]>([]);
  public readonly tone = input<Tone>('neutral');

  /** Map of the point, drawn as a preview instead of a badge. */
  protected readonly map = computed(
    () => this.badges().find((b) => b.kind === 'map')?.label ?? null,
  );
  protected readonly scope = computed(() => this.badges().filter((b) => b.kind !== 'map'));

  /** Detail lines joined into one muted line. */
  protected readonly meta = computed(() => this.details().filter(Boolean).join(' · '));
  protected readonly rewatchCount = computed(() =>
    this.rewatch().reduce((sum, group) => sum + group.rounds.length, 0),
  );
}
