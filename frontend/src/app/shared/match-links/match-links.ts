import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideChevronRight } from '@lucide/angular';

import { Rate, RoundRef } from '@core/common/common.model';
import { agree, dayMonth, fraction, hourMinute } from '@core/format/format.utils';
import { FindingMatch, MatchWording } from '@core/periods/findings.model';
import { matchQueryParams, sessionRoute } from '@core/sessions/session-link.utils';
import { MapThumb } from '@shared/game-art/map-thumb';

/**
 * The matches a point is built on, one link per match to its page: map, date, score, then the
 * point's own figure in that match ('5/6 duels').
 */
@Component({
  selector: 'app-match-links',
  imports: [RouterLink, LucideChevronRight, MapThumb],
  template: `
    <ul class="flex flex-col gap-px">
      @for (row of rows(); track row.matchId) {
        <li>
          <a
            [routerLink]="row.route"
            [queryParams]="row.params"
            class="focus-ring-inset group/match grid grid-cols-[1.75rem_minmax(0,1fr)_auto_auto] items-center gap-x-3 bg-surface-950/40 px-3 py-1.5 text-sm !text-text-secondary no-underline transition-colors hover:bg-brand-500/8 hover:!text-text-primary"
          >
            <app-map-thumb [map]="row.mapName" />
            <span class="min-w-0 truncate">
              <span class="font-semibold text-text-primary">{{ row.mapName }}</span>
              {{ row.when }}
              <span class="font-semibold" [class]="row.won ? 'good' : 'bad'">{{ row.score }}</span>
              @if (row.rewatch) {
                <span class="ml-1.5 text-brand-400">à revoir : {{ row.rewatch }}</span>
              }
            </span>
            <span class="tabular-nums">{{ row.figure }}</span>
            <svg
              class="size-4 text-text-muted transition-colors group-hover/match:text-brand-400"
              lucideChevronRight
              aria-hidden="true"
            ></svg>
          </a>
        </li>
      }
    </ul>
  `,
  host: { class: 'block' },
})
export class MatchLinks {
  public readonly matches = input.required<FindingMatch[]>();
  /** What the figure counts ('rounds', 'duels'...). */
  public readonly unit = input('');
  /** What the count and the total stand for; when set, the figure reads as a sentence. */
  public readonly wording = input<MatchWording | null>(null);
  /** Rounds to rewatch, each written on the line of its match ('R4, R9'). */
  public readonly rewatch = input<RoundRef[]>([]);

  protected readonly rows = computed(() =>
    this.matches().map((m) => ({
      matchId: m.matchId,
      mapName: m.mapName,
      route: sessionRoute(m),
      params: matchQueryParams(m),
      when: `${dayMonth(m.startedAt)} à ${hourMinute(m.startedAt)}`,
      score: `${m.roundsWon}-${m.roundsLost}`,
      won: m.roundsWon > m.roundsLost,
      figure: this.figure(m.rate),
      rewatch: this.rewatch()
        .filter((ref) => ref.matchId === m.matchId)
        .map((ref) => `R${ref.roundNumber}`)
        .join(', '),
    })),
  );

  /** '3 throws sur 5 rounds à 2 joueurs d'avance' with a wording, '3/5 rounds' without. */
  private figure(rate: Rate): string {
    const wording = this.wording();
    if (!wording) {
      return `${fraction(rate)} ${this.unit()}`.trim();
    }
    const counted = agree(wording.counted, rate.count);
    return `${rate.count} ${counted} sur ${rate.total} ${agree(wording.tries, rate.total)}`.trim();
  }
}
