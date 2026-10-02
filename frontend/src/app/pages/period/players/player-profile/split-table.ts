import { Component, input } from '@angular/core';

import { decimal, percentOf } from '@core/format/format.utils';
import { SplitRow } from '@core/periods/player.model';
import { AgentName } from '@shared/game-art/agent-name';
import { MapName } from '@shared/game-art/map-name';
import { InfoTip } from '@shared/info-tip/info-tip';
import { RatingAgainstClassPipe, RatingClassPipe } from '@shared/rating/rating-class.pipe';

/** Key stats of a player per side, agent or map. */
@Component({
  selector: 'app-split-table',
  imports: [RatingClassPipe, RatingAgainstClassPipe, InfoTip, AgentName, MapName],
  templateUrl: './split-table.html',
  host: { class: 'table-scroll block' },
})
export class SplitTable {
  public readonly rows = input.required<SplitRow[]>();
  public readonly label = input.required<string>();
  public readonly withMatches = input(true);
  /** Picture in front of each row's label: an agent portrait or a map banner. */
  public readonly art = input<'agent' | 'map' | null>(null);

  protected readonly decimal = decimal;
  protected readonly percentOf = percentOf;
}
