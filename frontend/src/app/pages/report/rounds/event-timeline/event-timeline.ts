import { Component, computed, input, output } from '@angular/core';

import { clock } from '@core/format/format.utils';
import { RoundEvent } from '@core/report/rounds.model';

import { aliveDots, eventTag } from './event-timeline.utils';

/** Every kill, plant and defuse of the round with the players alive after it; a line selects its event. */
@Component({
  selector: 'app-event-timeline',
  templateUrl: './event-timeline.html',
  host: { class: 'flex flex-col gap-3' },
})
export class EventTimeline {
  public readonly events = input.required<readonly RoundEvent[]>();
  public readonly step = input(0);
  public readonly stepChange = output<number>();

  protected readonly lines = computed(() =>
    this.events().map((event, index) => ({
      index,
      time: clock(event.ms),
      tag: eventTag(event),
      text: event.text,
      own: aliveDots(event.ownAlive),
      opp: aliveDots(event.oppAlive),
      state: `${event.ownAlive}v${event.oppAlive}`,
    })),
  );
}
