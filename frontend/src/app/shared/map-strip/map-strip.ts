import { Component, computed, input } from '@angular/core';

import { signedRounds, stripTone } from '@core/report/gap.utils';
import { MapGap } from '@core/report/squad.model';

import { STRIP_FILLS } from './map-strip.constants';

/**
 * One gap map by map, a cell per map in the order of the header strip: red on every map is a squad
 * habit, a single red cell a map problem.
 */
@Component({
  selector: 'app-map-strip',
  template: `
    @for (cell of cells(); track cell.map) {
      <i
        class="grid h-6 w-8 place-items-center font-display text-xs font-semibold not-italic sm:w-9"
        [class]="cell.fill"
        [title]="cell.title"
        >{{ cell.text }}</i
      >
    }
  `,
  host: { class: 'inline-flex gap-0.5', role: 'img', '[attr.aria-label]': 'label()' },
})
export class MapStrip {
  /** Maps in header order. */
  public readonly maps = input.required<readonly string[]>();
  public readonly gaps = input.required<readonly MapGap[]>();

  protected readonly cells = computed(() =>
    this.maps().map((map) => {
      const gap = this.gaps().find((g) => g.mapName === map)?.gap;
      const tone = gap ? stripTone(gap) : 'none';
      const text = gap && tone !== 'none' && tone !== 'even' ? signedRounds(gap.rounds) : '';
      return {
        map,
        fill: STRIP_FILLS[tone],
        text,
        title: gap
          ? `${map} : ${signedRounds(gap.rounds)} rounds sur ${gap.n}`
          : `${map} : pas joué`,
      };
    }),
  );
  protected readonly label = computed(() =>
    this.cells()
      .map((c) => `${c.title}`)
      .join(', '),
  );
}
