import { Component, input } from '@angular/core';

import { formatValue } from '@core/format/value-format.utils';
import { ScoreboardLine } from '@core/report/matches.model';
import { AgentIcon } from '@shared/game-art/agent-icon';
import { InfoTip } from '@shared/info-tip/info-tip';
import { RankIcon } from '@shared/rank-icon/rank-icon';

import { SCOREBOARD_COLUMNS } from './scoreboard.constants';

/** One team's scoreboard of a match, best ACS first (the API's order), the best line underlined. */
@Component({
  selector: 'app-scoreboard',
  imports: [AgentIcon, InfoTip, RankIcon],
  templateUrl: './scoreboard.html',
  host: { class: 'block min-w-0' },
})
export class Scoreboard {
  /** "L'escouade" or "Adversaires". */
  public readonly title = input.required<string>();
  public readonly lines = input.required<readonly ScoreboardLine[]>();
  /** Squad names are written brighter than the opponents'. */
  public readonly squad = input(false);

  protected readonly columns = SCOREBOARD_COLUMNS;
  protected readonly format = formatValue;
}
