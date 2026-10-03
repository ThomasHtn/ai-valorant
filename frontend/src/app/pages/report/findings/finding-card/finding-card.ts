import { Component, computed, input, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideChevronDown } from '@lucide/angular';

import { STATUS_LABELS } from '@core/format/labels.constants';
import { formatValue, integer } from '@core/format/value-format.utils';
import { FindingSubject } from '@core/report/finding-subjects.model';
import {
  detailLabel,
  findingLinks,
  fiveStackCaveat,
  gapUnit,
  mainCauses,
  referenceText,
  subjectLabel,
  verdictText,
} from '@core/report/finding-subjects.utils';
import { Finding } from '@core/report/findings.model';
import { Rate } from '@core/report/rate.model';
import { Badge } from '@shared/badge/badge';
import { BetterHint } from '@shared/better-hint/better-hint';
import { GapChip } from '@shared/gap-chip/gap-chip';
import { resolveArt } from '@shared/game-art/art.utils';
import { RowArt } from '@shared/game-art/row-art';
import { RewatchLinks } from '@shared/rewatch-links/rewatch-links';

import { barWidth } from '../findings-view.utils';

/** One bar of the card: who, the rate as text, its sample ('44 sur 110') and the bar width. */
interface RateBar {
  label: string;
  value: string;
  sample: string;
  width: number;
  /** Tailwind background class of the bar. */
  fill: string;
  isSquad: boolean;
}

/** A finding of the same subject, folded under the lead as one line. */
interface OtherLine {
  label: string;
  detail: string;
  gap: string;
  confirmed: boolean;
}

/** Gives each card's folding body a unique id. */
let cardCount = 0;

const ONE_DECIMAL = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** '−8,5', '+12,7': rounds won or lost against the reference. */
function signedRounds(gap: number): string {
  return `${gap > 0 ? '+' : gap < 0 ? '−' : ''}${ONE_DECIMAL.format(Math.abs(gap))}`;
}

/**
 * Everything the period says about one subject (a map, a player, a global scope), folded to one
 * line so the list reads at a glance. Opened, the costliest finding shows its bars against both
 * references, why its rounds were lost and where to look; the other findings of the subject follow
 * as single lines since they count the same rounds.
 */
@Component({
  selector: 'app-finding-card',
  imports: [Badge, BetterHint, GapChip, LucideChevronDown, RowArt, RewatchLinks, RouterLink],
  templateUrl: './finding-card.html',
  host: { class: 'block bg-text-primary/4' },
})
export class FindingCard {
  public readonly subject = input.required<FindingSubject>();
  public readonly playerAgents = input<Record<string, string>>({});
  /** Opened at first (the top card of a column), folded otherwise. */
  public readonly initiallyOpen = input(false);

  protected readonly open = linkedSignal(() => this.initiallyOpen());
  protected readonly bodyId = `finding-${++cardCount}`;

  protected readonly lead = computed<Finding>(() => this.subject().lead);
  protected readonly title = computed(() => subjectLabel(this.lead()));
  protected readonly metric = computed(() => detailLabel(this.lead()));
  protected readonly art = computed(() => resolveArt(this.lead().art, this.playerAgents()));
  protected readonly isWeak = computed(() => this.lead().side === 'weak');
  protected readonly statusLabel = computed(() => STATUS_LABELS[this.lead().status]);
  protected readonly gapText = computed(() => signedRounds(this.lead().gapRounds));
  protected readonly gapUnit = computed(() => gapUnit(this.lead()));
  protected readonly causes = computed(() => mainCauses(this.lead()));
  protected readonly caveat = computed(() => fiveStackCaveat(this.lead()));
  protected readonly links = computed(() => findingLinks(this.lead()));
  protected readonly verdict = computed(() => verdictText(this.lead()));

  protected readonly others = computed<OtherLine[]>(() =>
    this.subject().others.map((f) => ({
      label: detailLabel(f),
      detail: referenceText(f),
      gap: signedRounds(f.gapRounds),
      confirmed: f.status === 'confirmed',
    })),
  );

  /** True when the card has any line under its bars. */
  protected readonly hasContext = computed(
    () =>
      !!this.causes() ||
      !!this.caveat() ||
      this.lead().rewatch.length > 0 ||
      this.others().length > 0 ||
      this.links().length > 0,
  );

  protected readonly bars = computed<RateBar[]>(() => {
    const f = this.lead();
    const bar = (label: string, rate: Rate, fill: string, isSquad = false): RateBar => ({
      label,
      value: formatValue(rate.value, 'pct'),
      sample: `${integer(rate.count)} sur ${integer(rate.total)}`,
      width: barWidth(rate.value),
      fill,
      isSquad,
    });
    return [
      bar("L'escouade", f.squad, this.isWeak() ? 'bg-rating-bad' : 'bg-rating-good', true),
      bar('Adversaires', f.opp, 'bg-opponent'),
      bar('Top ranked', f.top, 'bg-top'),
    ];
  });
}
