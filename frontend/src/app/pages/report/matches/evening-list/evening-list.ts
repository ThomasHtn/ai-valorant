import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { longDay } from '@core/format/format.utils';
import { EveningMatches } from '@core/report/matches.model';
import { Badge } from '@shared/badge/badge';
import { MapThumb } from '@shared/game-art/map-thumb';

import { startTime } from '../matches.utils';

/** Matches of the period by evening: map, start time and score; the open match is marked. */
@Component({
  selector: 'app-evening-list',
  imports: [RouterLink, Badge, MapThumb],
  templateUrl: './evening-list.html',
})
export class EveningList {
  public readonly evenings = input.required<readonly EveningMatches[]>();
  public readonly selected = input<string | null>(null);

  protected readonly longDay = longDay;
  protected readonly startTime = startTime;
}
