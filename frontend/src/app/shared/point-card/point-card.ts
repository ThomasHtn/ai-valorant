import { Component, computed, input, signal } from '@angular/core';
import { LucideChevronRight, LucideDynamicIcon, LucideIcon } from '@lucide/angular';

import { BadgeContent } from '@core/common/badge.model';
import { Tone } from '@core/common/enums.model';
import { PointReference } from '@core/common/point-reference.model';
import { HelpTopic } from '@core/help/stat-help.constants';
import { FindingMatch, RewatchGroup } from '@core/periods/findings.model';
import { Badge } from '@shared/badge/badge';
import { AgentIcon } from '@shared/game-art/agent-icon';
import { MapThumb } from '@shared/game-art/map-thumb';
import { InfoTip } from '@shared/info-tip/info-tip';
import { MatchLinks } from '@shared/match-links/match-links';

import {
  POINT_FIGURE_CLASS,
  POINT_LEAD_CLASS,
  POINT_REFERENCE_CLASS,
} from './point-card.constants';

/**
 * A point as one compact row: a picture of where it happens (map, player, or an icon), the title
 * over that place, then the squad's figure and the references in fixed columns so a list reads as
 * a table.
 */
@Component({
  selector: 'app-point-card',
  imports: [AgentIcon, Badge, InfoTip, LucideChevronRight, LucideDynamicIcon, MapThumb, MatchLinks],
  template: `
    <!-- The place is named on the second line too, so a phone can drop the picture for room. -->
    @if (map(); as map) {
      <span [class]="leadClass"><app-map-thumb [map]="map" size="md" /></span>
    } @else if (agent(); as agent) {
      <span [class]="leadClass"
        ><app-agent-icon [agent]="agent" size="md" [decorative]="true"
      /></span>
    } @else if (icon(); as icon) {
      <span [class]="leadClass + ' bg-surface-700/70 text-text-secondary'">
        <svg class="size-5" [lucideIcon]="icon" aria-hidden="true"></svg>
      </span>
    }
    <div class="min-w-0 flex-1">
      <p class="flex min-w-0 items-center gap-1.5 font-semibold text-text-primary">
        {{ title() }}
        @if (help(); as help) {
          <app-info-tip [topic]="help" />
        }
      </p>
      @if (
        placeLabel() || scope().length || status() || meta() || rewatchCount() || matches().length
      ) {
        <div
          class="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm leading-snug text-text-muted"
        >
          @if (placeLabel(); as place) {
            <span class="font-semibold text-text-secondary">{{ place }}</span>
          }
          @for (badge of scope(); track $index) {
            <app-badge [label]="badge.label" [kind]="badge.kind" size="sm" />
          }
          @if (status(); as s) {
            <app-badge [label]="s.label" [kind]="s.kind" size="sm" />
          }
          @if (meta()) {
            <span>{{ meta() }}</span>
          }
          @if (matches().length) {
            <button
              type="button"
              class="focus-ring inline-flex cursor-pointer items-center gap-0.5 text-brand-400 hover:text-brand-300"
              [attr.aria-expanded]="matchesOpen()"
              (click)="matchesOpen.set(!matchesOpen())"
            >
              <svg
                class="size-3.5 transition-transform motion-reduce:transition-none"
                [class.rotate-90]="matchesOpen()"
                lucideChevronRight
                aria-hidden="true"
              ></svg>
              {{
                matches().length > 1 ? 'Voir les ' + matches().length + ' matchs' : 'Voir le match'
              }}
            </button>
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

    <!-- Figure, then each reference: a line of its own on a phone, fixed columns above. -->
    <dl class="flex w-full shrink-0 items-baseline gap-5 sm:w-auto sm:gap-0 sm:text-right">
      <!-- Kept when empty so the columns stay aligned. -->
      <div [class]="figureClass">
        @if (value()) {
          <dt class="sr-only">L'escouade</dt>
          <dd
            class="font-display text-xl leading-none font-semibold whitespace-nowrap tabular-nums"
            [class.good]="tone() === 'good'"
            [class.bad]="tone() === 'bad'"
          >
            {{ value() }}
          </dd>
        }
      </div>
      @for (ref of references(); track ref.label) {
        <div [class]="referenceClass + ' flex flex-col-reverse'">
          <!-- Under a list head, the column names the figure on screens wide enough to show it. -->
          <dt class="mt-1 text-xs leading-none text-text-muted" [class.sm:sr-only]="!labelled()">
            {{ ref.label }}
          </dt>
          <dd class="leading-none text-text-secondary tabular-nums">{{ ref.value ?? '-' }}</dd>
        </div>
      }
    </dl>

    @if (matchesOpen() && matches().length) {
      <app-match-links
        class="mt-1 w-full basis-full sm:pl-[3.25rem]"
        [matches]="matches()"
        [unit]="unit()"
      />
    }
  `,
  host: {
    class:
      'mb-1 flex flex-wrap items-center gap-3 border-l-2 border-edge-strong bg-text-primary/4 px-4 py-2.5',
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
  public readonly references = input<PointReference[]>([]);
  public readonly rewatch = input<RewatchGroup[]>([]);
  public readonly tone = input<Tone>('neutral');
  /** Where the point happens when it is not a map ('Toutes cartes', a player's name). */
  public readonly place = input<string | null>(null);
  /** Portrait shown when the point is about a player. */
  public readonly agent = input<string | null>(null);
  /** Picture of last resort, so rows of a list keep their titles aligned. */
  public readonly icon = input<LucideIcon | null>(null);
  /** Explanation of the stat, behind an "i" after the title. */
  public readonly help = input<HelpTopic | null>(null);
  /** False under a head that names the reference columns once. */
  public readonly labelled = input(true);
  /** Matches the figure comes from, each opening its page; folded under the row. */
  public readonly matches = input<FindingMatch[]>([]);
  /** What the figure counts in each match ('rounds', 'duels'...). */
  public readonly unit = input('');

  protected readonly matchesOpen = signal(false);

  protected readonly leadClass = POINT_LEAD_CLASS;
  protected readonly figureClass = POINT_FIGURE_CLASS;
  protected readonly referenceClass = POINT_REFERENCE_CLASS;

  /** Map of the point, drawn as a preview instead of a badge. */
  protected readonly map = computed(
    () => this.badges().find((b) => b.kind === 'map')?.label ?? null,
  );
  protected readonly placeLabel = computed(() => this.map() ?? this.place());
  protected readonly scope = computed(() => this.badges().filter((b) => b.kind !== 'map'));

  /** Detail lines joined into one muted line. */
  protected readonly meta = computed(() => this.details().filter(Boolean).join(', '));
  protected readonly rewatchCount = computed(() =>
    this.rewatch().reduce((sum, group) => sum + group.rounds.length, 0),
  );
}
