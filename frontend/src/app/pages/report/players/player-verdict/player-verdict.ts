import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { LucideThumbsUp, LucideTarget } from '@lucide/angular';

import { Reference } from '@core/common/enums.model';
import { TONE_TEXT_CLASSES } from '@shared/stat-tile/stat-tile.constants';

import { PlayerFigure } from '../players-figure.model';
import { VerdictItem } from './player-verdict.model';
import { playerVerdict } from './player-verdict.utils';

type StyledItem = VerdictItem & { valueClass: string; edgeClass: string };

/**
 * The answer to "how am I doing": how many key figures beat the reference, then the clearest
 * strengths and the figures to work on, each written as a sentence with its numbers.
 */
@Component({
  selector: 'app-player-verdict',
  imports: [NgTemplateOutlet, LucideThumbsUp, LucideTarget],
  templateUrl: './player-verdict.html',
  host: { class: 'view-section' },
})
export class PlayerVerdictView {
  public readonly figures = input.required<PlayerFigure[]>();
  public readonly reference = input.required<Reference>();
  /** 'les initiateurs des équipes affrontées'. */
  public readonly who = input.required<string>();

  /** 'Ses chiffres clés face aux initiateurs des équipes affrontées'. */
  protected readonly heading = computed(
    () =>
      `Ses chiffres clés face ${this.who().replace(/^les /, 'aux ').replace(/^ses /, 'à ses ')}`,
  );
  protected readonly verdict = computed(() =>
    playerVerdict(this.figures(), this.reference(), this.who()),
  );
  /** Items with their colour classes, so the shared line template stays untyped-safe. */
  protected readonly strengths = computed(() => this.styled(this.verdict().strengths));
  protected readonly weaknesses = computed(() => this.styled(this.verdict().weaknesses));
  protected readonly score = computed(() => {
    const { good, avg, bad } = this.verdict().counts;
    return [
      { key: 'good', count: good, label: 'au-dessus', class: 'text-rating-good' },
      {
        key: 'avg',
        count: avg,
        label: avg > 1 ? 'proches' : 'proche',
        class: 'text-rating-average',
      },
      { key: 'bad', count: bad, label: 'en dessous', class: 'text-rating-bad' },
    ];
  });

  private styled(items: readonly VerdictItem[]): StyledItem[] {
    return items.map((item) => ({
      ...item,
      valueClass: TONE_TEXT_CLASSES[item.tone],
      edgeClass: item.tone === 'good' ? 'border-rating-good' : 'border-rating-bad',
    }));
  }
}
