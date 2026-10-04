import { Component, computed, input } from '@angular/core';

import { integer } from '@core/format/value-format.utils';
import { parseRank, rankIcon } from '@core/game-assets/rank.utils';
import { PlayerSheet } from '@core/report/players.model';
import { AgentIcon } from '@shared/game-art/agent-icon';
import { RoleIcon } from '@shared/game-art/role-icon';

import { roleLabel } from '../players.utils';

/**
 * The player's card, like a game's career screen: big portrait, name, role, rank emblem, how much he
 * played and on which agents.
 */
@Component({
  selector: 'app-player-card',
  imports: [AgentIcon, RoleIcon],
  templateUrl: './player-card.html',
  host: { class: 'block' },
})
export class PlayerCard {
  public readonly sheet = input.required<PlayerSheet>();

  protected readonly role = computed(() => roleLabel(this.sheet().role));
  protected readonly rank = computed(() => {
    const rank = parseRank(this.sheet().rank);
    return rank ? { label: rank.label, src: rankIcon(rank) } : null;
  });
  protected readonly volume = computed(() => {
    const { matches, rounds } = this.sheet();
    return [
      { key: 'matches', value: integer(matches), label: matches > 1 ? 'matchs' : 'match' },
      { key: 'rounds', value: integer(rounds), label: 'rounds' },
    ];
  });
  protected readonly agents = computed(() =>
    this.sheet().agents.map((a) => ({
      agent: a.agent,
      matches: `${a.matches} match${a.matches > 1 ? 's' : ''}`,
    })),
  );
}
