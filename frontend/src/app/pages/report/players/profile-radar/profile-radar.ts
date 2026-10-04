import { Component, computed, input } from '@angular/core';

import { Reference } from '@core/common/enums.model';
import { HoverTip } from '@shared/hover-tip/hover-tip';
import { InfoTip } from '@shared/info-tip/info-tip';

import { RADAR_HELP, RADAR_REFERENCE_COLOUR, RADAR_SQUAD_COLOUR } from './profile-radar.constants';
import { RadarSeries } from './profile-radar.model';
import { buildRadar } from './profile-radar.utils';

/** Gives each radar on a page its own heading id. */
let radarCount = 0;

/**
 * Kiviat chart of one or two players: their key figures on one web, each on its own fixed scale, so
 * strong and weak sides read at a glance. A lone player is drawn over his reference (dashed) with his
 * points coloured like his figures; players compared get their own colour.
 */
@Component({
  selector: 'app-profile-radar',
  imports: [HoverTip, InfoTip],
  templateUrl: './profile-radar.html',
  host: { class: 'view-section' },
})
export class ProfileRadar {
  public readonly series = input.required<RadarSeries[]>();
  public readonly reference = input.required<Reference>();
  /** Who the reference is, for the legend and tips ('Initiateurs adverses'). */
  public readonly referenceName = input('Référence');
  /** True when the values are written beside the web: the web then shows axis names only. */
  public readonly split = input(false);
  /** Block title; the id of its heading names the region. */
  public readonly title = input('Profil');

  protected readonly titleId = `radar-${++radarCount}`;
  protected readonly help = RADAR_HELP;
  protected readonly referenceColour = RADAR_REFERENCE_COLOUR;
  protected readonly legend = computed(() =>
    this.series().map((one) => ({ name: one.name, colour: one.colour ?? RADAR_SQUAD_COLOUR })),
  );
  protected readonly label = computed(
    () =>
      `Profil de ${this.series()
        .map((s) => s.name)
        .join(' et ')}`,
  );
  protected readonly view = computed(() =>
    buildRadar(this.series(), this.reference(), this.referenceName()),
  );
}
