import { Component, computed, input, output, signal } from '@angular/core';
import { LucideChevronLeft, LucideChevronRight, LucideRotateCw } from '@lucide/angular';

import { RoundEvent } from '@core/report/rounds.model';
import { InfoTip } from '@shared/info-tip/info-tip';
import { MinimapCanvas } from '@shared/minimap-canvas/minimap-canvas';
import { nextRotation } from '@shared/minimap-canvas/minimap-canvas.utils';

import { replayMarkers } from './replay-2d.utils';

/**
 * Positions of the ten players at one event of the round on the real minimap, with a stepper to
 * walk through the events. Henrik only records positions at kills, plants and defuses. The map opens
 * with attackers at the bottom and defenders on top; "Pivoter" turns it a quarter at a time.
 */
@Component({
  selector: 'app-replay-2d',
  imports: [InfoTip, LucideChevronLeft, LucideChevronRight, LucideRotateCw, MinimapCanvas],
  templateUrl: './replay-2d.html',
  host: { class: 'flex flex-col gap-3' },
})
export class Replay2d {
  public readonly map = input.required<string>();
  public readonly events = input.required<readonly RoundEvent[]>();
  /** Turn putting attackers at the bottom, from the API. */
  public readonly rotation = input(0);
  public readonly step = input(0);
  public readonly stepChange = output<number>();

  /** Quarter turns the analyst added, kept from one round to the next. */
  private readonly extraTurn = signal(0);
  protected readonly shownRotation = computed(() => (this.rotation() + this.extraTurn()) % 360);

  protected readonly markers = computed(() => replayMarkers(this.events()[this.step()]));
  protected readonly last = computed(() => this.events().length - 1);

  protected rotate(): void {
    this.extraTurn.update(nextRotation);
  }

  protected onSlide(event: Event): void {
    this.stepChange.emit(Number((event.target as HTMLInputElement).value));
  }
}
