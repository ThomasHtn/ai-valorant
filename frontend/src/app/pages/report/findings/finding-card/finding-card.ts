import {
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideChevronDown, LucideUsers } from '@lucide/angular';

import { STATUS_LABELS } from '@core/format/labels.constants';
import { formatValue, integer } from '@core/format/value-format.utils';
import { FindingSubject } from '@core/report/finding-subjects.model';
import {
  detailLabel,
  findingLinks,
  fiveStackCaveat,
  mainCauses,
  referenceText,
  subjectLabel,
  verdictText,
} from '@core/report/finding-subjects.utils';
import { Finding } from '@core/report/findings.model';
import { Rate } from '@core/report/rate.model';
import { Badge } from '@shared/badge/badge';
import { BetterHint } from '@shared/better-hint/better-hint';
import { resolveArt } from '@shared/game-art/art.utils';
import { RowArt } from '@shared/game-art/row-art';
import { RewatchLinks } from '@shared/rewatch-links/rewatch-links';
import { roundsGapText } from '@shared/rounds-gap/rounds-gap.utils';
import { RoundsGap } from '@shared/rounds-gap/rounds-gap';

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

/** '8 rounds perdus': rounds won or lost against the reference, in words. */
function roundsText(gap: number): string {
  const text = roundsGapText(gap);
  return `${text.count} ${text.words}`;
}

/**
 * Everything the period says about one subject (a map, a player, a global scope), folded to one
 * line with a bar of the rounds at stake. Opened, the costliest finding shows its bars against both
 * references, why its rounds were lost and where to look; the other findings of the subject follow
 * as single lines since they count the same rounds.
 */
@Component({
  selector: 'app-finding-card',
  imports: [
    Badge,
    BetterHint,
    LucideChevronDown,
    LucideUsers,
    RoundsGap,
    RowArt,
    RewatchLinks,
    RouterLink,
  ],
  templateUrl: './finding-card.html',
  host: { class: 'block bg-text-primary/4' },
})
export class FindingCard {
  public readonly subject = input.required<FindingSubject>();
  /** Largest gap of the period in rounds: the length of a full bar. */
  public readonly scale = input(1);
  public readonly playerAgents = input<Record<string, string>>({});
  /** Opened at first (the card a Résumé link asked for), folded otherwise. */
  public readonly initiallyOpen = input(false);
  /** Brought into view once drawn: the card a Résumé line asked for. */
  public readonly focused = input(false);

  protected readonly open = linkedSignal(() => this.initiallyOpen());
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly bodyId = `finding-${++cardCount}`;

  protected readonly lead = computed<Finding>(() => this.subject().lead);
  protected readonly title = computed(() => subjectLabel(this.lead()));
  protected readonly metric = computed(() => detailLabel(this.lead()));
  protected readonly art = computed(() => resolveArt(this.lead().art, this.playerAgents()));
  protected readonly isWeak = computed(() => this.lead().side === 'weak');
  protected readonly statusLabel = computed(() => STATUS_LABELS[this.lead().status]);
  protected readonly comparison = computed(() => referenceText(this.lead()));
  protected readonly gapWidth = computed(() =>
    Math.max(2, Math.min(100, (Math.abs(this.lead().gapRounds) / this.scale()) * 100)),
  );
  protected readonly causes = computed(() => mainCauses(this.lead()));
  protected readonly caveat = computed(() => fiveStackCaveat(this.lead()));
  protected readonly links = computed(() => findingLinks(this.lead()));
  protected readonly verdict = computed(() => verdictText(this.lead()));

  protected readonly others = computed<OtherLine[]>(() =>
    this.subject().others.map((f) => ({
      label: detailLabel(f),
      detail: referenceText(f),
      gap: roundsText(f.gapRounds),
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

  constructor() {
    afterNextRender(() => {
      if (this.focused()) {
        this.host.nativeElement.scrollIntoView({ block: 'center' });
      }
    });
  }
}
