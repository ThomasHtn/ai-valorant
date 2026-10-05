import { Component, input, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideChevronRight, LucidePlay } from '@lucide/angular';

import { AgentIcon } from '@shared/game-art/agent-icon';
import { MapThumb } from '@shared/game-art/map-thumb';
import { HoverTip } from '@shared/hover-tip/hover-tip';
import { InfoTip } from '@shared/info-tip/info-tip';

import { HABIT_READING_CLASSES } from '../habit-board/habit-board.constants';
import { RoundsPill } from '../rounds-pill/rounds-pill';
import { SituationIcon } from '../situation-icon/situation-icon';
import { DASH_TEXTS } from '../squad.constants';
import { SituationLine } from '../squad.model';
import {
  PLAYER_COLUMNS,
  READING_SENTENCES,
  SITUATION_COLUMNS,
  SITUATION_MIN_WIDTH,
} from './situation-table.constants';

/**
 * Situations against the top ranked, one line each: played, won, squad rate, top ranked rate, gap in
 * points and in rounds, and the map where it costs (or pays) most. A line opens on its maps, its
 * players when one player decides it, and the rounds to rewatch.
 */
@Component({
  selector: 'app-situation-table',
  imports: [
    AgentIcon,
    HoverTip,
    InfoTip,
    LucideChevronRight,
    LucidePlay,
    MapThumb,
    RoundsPill,
    RouterLink,
    SituationIcon,
  ],
  templateUrl: './situation-table.html',
  host: { class: 'block overflow-x-auto' },
})
export class SituationTable {
  public readonly lines = input.required<readonly SituationLine[]>();
  /** Name of the first column: 'Situation', 'Achat'. */
  public readonly first = input('Situation');
  /** Opens the first line from the start (the costliest priority). */
  public readonly openFirst = input(false);

  /** Key of the open line; one at a time. */
  protected readonly open = linkedSignal(() =>
    this.openFirst() ? (this.lines()[0]?.key ?? null) : null,
  );
  protected readonly tones = DASH_TEXTS;
  protected readonly readings = HABIT_READING_CLASSES;
  protected readonly sentences = READING_SENTENCES;
  protected readonly cols = SITUATION_COLUMNS;
  protected readonly playerCols = PLAYER_COLUMNS;
  protected readonly minWidth = SITUATION_MIN_WIDTH;

  protected toggle(key: string): void {
    this.open.update((current) => (current === key ? null : key));
  }
}
