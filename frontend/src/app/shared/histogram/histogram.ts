import { Component, computed, input, signal } from '@angular/core';

import { Histogram, HistogramBin } from '@core/report/distributions.model';

import { SQUAD_COLOUR, TOP_COLOUR } from './histogram.constants';
import { BarView } from './histogram.model';
import { buildHistogram } from './histogram.utils';

/**
 * How values spread, drawn to scale in inline SVG: the squad as filled bars, top ranked as outlines,
 * both as shares of their sample so they compare whatever their size, with dashed medians. Hovering
 * or focusing a bar opens its tip (share and count of each side).
 */
@Component({
  selector: 'app-histogram',
  templateUrl: './histogram.html',
  host: { class: 'relative block' },
})
export class HistogramChart {
  public readonly bins = input.required<HistogramBin[]>();
  public readonly binSize = input.required<number>();
  /** Unit of the values ('s', 'm', 'ACS'). */
  public readonly unit = input.required<string>();
  /** Axis title, e.g. 'Temps du premier kill'. */
  public readonly label = input.required<string>();
  public readonly squad = input.required<Histogram>();
  public readonly top = input<Histogram | null>(null);
  /** Who the bars are: "L'escouade" or a player's name. */
  public readonly squadLabel = input("L'escouade");

  protected readonly squadColour = SQUAD_COLOUR;
  protected readonly topColour = TOP_COLOUR;
  protected readonly view = computed(() =>
    buildHistogram({
      bins: this.bins(),
      binSize: this.binSize(),
      unit: this.unit(),
      squad: this.squad(),
      top: this.top(),
      squadName: this.squadLabel() === "L'escouade" ? 'escouade' : this.squadLabel(),
    }),
  );
  protected readonly hovered = signal<BarView | null>(null);
}
