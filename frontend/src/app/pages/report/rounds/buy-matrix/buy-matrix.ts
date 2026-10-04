import { Component, computed, input, output } from '@angular/core';

import { BuyType, Side } from '@core/common/enums.model';
import { SIDE_LABELS } from '@core/format/labels.constants';
import { RoundLine } from '@core/report/rounds.model';
import { MapThumb } from '@shared/game-art/map-thumb';

import { MATRIX_BUY_LABELS, MATRIX_BUYS, MATRIX_GAP_POINTS } from '../rounds-overview.constants';
import { MatrixCell } from '../rounds-overview.model';
import { buyMatrix } from '../rounds-overview.utils';

/** Where a matrix cell sends the round list. */
export interface MatrixPick {
  map: string;
  side: Side;
  buy: BuyType | '';
}

/**
 * Rounds won by map, side and buy: two lines per map (attack, defense) and one column per buy.
 * A cell coloured red is a map losing more than the squad usually does with the same buy and side;
 * a click lists its lost rounds.
 */
@Component({
  selector: 'app-buy-matrix',
  imports: [MapThumb],
  templateUrl: './buy-matrix.html',
  host: { class: 'view-section' },
})
export class BuyMatrix {
  public readonly rounds = input.required<readonly RoundLine[]>();
  public readonly picked = output<MatrixPick>();

  protected readonly rows = computed(() => buyMatrix(this.rounds()));
  protected readonly buys = MATRIX_BUYS;
  protected readonly buyLabels = MATRIX_BUY_LABELS;
  protected readonly sideLabels = SIDE_LABELS;
  protected readonly gap = MATRIX_GAP_POINTS;

  protected percent(cell: MatrixCell): string {
    return cell.played ? `${Math.round((cell.won / cell.played) * 100)} %` : '';
  }

  protected toneClass(cell: MatrixCell): string {
    return cell.tone === 'neutral' ? 'bg-text-primary/4' : `tone-${cell.tone}`;
  }
}
