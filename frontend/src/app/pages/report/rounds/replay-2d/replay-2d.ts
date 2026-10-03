import { Component, computed, input, output } from '@angular/core';
import { LucideChevronLeft, LucideChevronRight } from '@lucide/angular';

import { RoundEvent } from '@core/report/rounds.model';
import { InfoTip } from '@shared/info-tip/info-tip';
import { MinimapCanvas } from '@shared/minimap-canvas/minimap-canvas';

import { replayMarkers } from './replay-2d.utils';

/**
 * Positions of the ten players at one event of the round on the real minimap, with a stepper to
 * walk through the events. Henrik only records positions at kills, plants and defuses.
 */
@Component({
  selector: 'app-replay-2d',
  imports: [InfoTip, LucideChevronLeft, LucideChevronRight, MinimapCanvas],
  templateUrl: './replay-2d.html',
  host: { class: 'flex flex-col gap-3' },
})
export class Replay2d {
  public readonly map = input.required<string>();
  public readonly events = input.required<readonly RoundEvent[]>();
  public readonly step = input(0);
  public readonly stepChange = output<number>();

  protected readonly markers = computed(() => replayMarkers(this.events()[this.step()]));
  protected readonly last = computed(() => this.events().length - 1);

  protected onSlide(event: Event): void {
    this.stepChange.emit(Number((event.target as HTMLInputElement).value));
  }
}
