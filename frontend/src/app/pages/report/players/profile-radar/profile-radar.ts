import { Component, computed, input } from '@angular/core';

import { Reference } from '@core/common/enums.model';
import { REFERENCE_SHORT_LABELS } from '@core/format/labels.constants';
import { HoverTip } from '@shared/hover-tip/hover-tip';
import { InfoTip } from '@shared/info-tip/info-tip';

import { RADAR_SQUAD_COLOUR } from './profile-radar.constants';
import { RadarSeries } from './profile-radar.model';
import { buildRadar } from './profile-radar.utils';

/** Gives each radar on a page its own heading id. */
let radarCount = 0;

/**
 * Kiviat chart of one or two players: their headline figures on one web, each placed by how much
 * better or worse than the reference of their role they are, so strong and weak sides read at a
 * glance. One player alone gets his points coloured like his tiles; players compared get their own
 * colour.
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
  public readonly colours = input(true);
  /** Block title; the id of its heading names the region. */
  public readonly title = input('Profil');

  protected readonly titleId = `radar-${++radarCount}`;
  /** History is each player himself; the other references are players of the same role. */
  protected readonly referenceLabel = computed(() =>
    this.reference() === 'hist'
      ? 'Le joueur avant la période'
      : `${REFERENCE_SHORT_LABELS[this.reference()]} du même rôle`,
  );
  protected readonly legend = computed(() =>
    this.series().map((one) => ({ name: one.name, colour: one.colour ?? RADAR_SQUAD_COLOUR })),
  );
  protected readonly label = computed(
    () =>
      `Profil de ${this.series()
        .map((s) => s.name)
        .join(' et ')} face à la référence`,
  );
  protected readonly view = computed(() =>
    buildRadar(this.series(), this.reference(), this.colours()),
  );
}
