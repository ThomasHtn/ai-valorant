import { Component, computed, input, output } from '@angular/core';

import { clock } from '@core/format/format.utils';
import { RoundEvent } from '@core/report/rounds.model';

import { chancesBefore } from '../round-moments.utils';
import { chanceShift, eventTag } from './event-timeline.utils';

/**
 * Every kill, plant and defuse of the round with the players alive after it and how the squad's
 * chance moved; a line selects its event, the key moment is marked.
 */
@Component({
  selector: 'app-event-timeline',
  templateUrl: './event-timeline.html',
  host: { class: 'flex flex-col gap-3' },
})
export class EventTimeline {
  public readonly events = input.required<readonly RoundEvent[]>();
  public readonly step = input(0);
  /** Index of the key moment's event, if any. */
  public readonly keyStep = input<number | null>(null);
  public readonly stepChange = output<number>();

  protected readonly lines = computed(() => {
    const before = chancesBefore(this.events());
    return this.events().map((event, index) => ({
      index,
      time: clock(event.ms),
      tag: eventTag(event),
      text: event.text,
      chance: chanceShift(before[index], event.winProbability),
      state: `${event.ownAlive}v${event.oppAlive}`,
    }));
  });
}
