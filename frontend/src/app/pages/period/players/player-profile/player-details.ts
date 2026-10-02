import { Component, input } from '@angular/core';

import { decimal, fraction, percent } from '@core/format/format.utils';
import { SIDE_LABELS } from '@core/format/labels.constants';
import { PlayerProfile } from '@core/periods/player.model';
import { HeatCell } from '@shared/heat-cell/heat-cell';
import { AgentName } from '@shared/game-art/agent-name';
import { MapName } from '@shared/game-art/map-name';
import { WeaponName } from '@shared/game-art/weapon-name';
import { InfoTip } from '@shared/info-tip/info-tip';

/** Round impact, weapons, death spots, clutches and utility of a player. */
@Component({
  selector: 'app-player-details',
  imports: [InfoTip, HeatCell, AgentName, MapName, WeaponName],
  templateUrl: './player-details.html',
})
export class PlayerDetails {
  public readonly profile = input.required<PlayerProfile>();

  protected readonly percent = percent;
  protected readonly fraction = fraction;
  protected readonly decimal = decimal;
  protected readonly sideLabels = SIDE_LABELS;
  protected readonly clutchLabels = ['1v1', '1v2', '1v3', '1v4', '1v5'];
}
