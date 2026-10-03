import { Component, input } from '@angular/core';

import { EMPTY } from '@core/format/format.utils';
import { ARMOR_LABELS } from '@core/format/round-labels.constants';
import { integer } from '@core/format/value-format.utils';
import { EconomyLine } from '@core/report/rounds.model';
import { AgentIcon } from '@shared/game-art/agent-icon';
import { WeaponName } from '@shared/game-art/weapon-name';

/** One team's buy at the end of the buy phase: weapon, armor, equipment value and credits left. */
@Component({
  selector: 'app-economy-table',
  imports: [AgentIcon, WeaponName],
  template: `
    <div class="overflow-x-auto">
      <table class="hover-rows w-full border-separate border-spacing-y-0.5 tabular-nums">
        <thead>
          <tr class="text-sm text-text-secondary">
            <th scope="col" class="bg-text-primary/8 px-2.5 py-2 text-left font-semibold">
              {{ title() }}
            </th>
            <th scope="col" class="bg-text-primary/8 px-2.5 py-2 text-left font-semibold">Arme</th>
            <th scope="col" class="bg-text-primary/8 px-2.5 py-2 text-right font-semibold">
              Armure
            </th>
            <th scope="col" class="bg-text-primary/8 px-2.5 py-2 text-right font-semibold">
              Équipement
            </th>
            <th scope="col" class="bg-text-primary/8 px-2.5 py-2 text-right font-semibold">
              Restant
            </th>
          </tr>
        </thead>
        <tbody>
          @for (line of lines(); track line.name) {
            <tr>
              <td class="min-w-36 bg-text-primary/4 px-2.5 py-1.5">
                <span class="flex items-center gap-2.5">
                  <app-agent-icon [agent]="line.agent" [decorative]="true" />{{ line.name }}
                </span>
              </td>
              <td class="bg-text-primary/4 px-2.5 py-1.5">
                @if (line.weapon) {
                  <app-weapon-name [weapon]="line.weapon" />
                } @else {
                  {{ empty }}
                }
              </td>
              <td class="bg-text-primary/4 px-2.5 py-1.5 text-right">
                {{ line.armor ? (armor[line.armor] ?? line.armor) : empty }}
              </td>
              <td class="bg-text-primary/4 px-2.5 py-1.5 text-right">
                {{ integer(line.loadout) }}
              </td>
              <td class="bg-text-primary/4 px-2.5 py-1.5 text-right">
                {{ integer(line.remaining) }}
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  host: { class: 'block min-w-0' },
})
export class EconomyTable {
  public readonly title = input.required<string>();
  public readonly lines = input.required<readonly EconomyLine[]>();

  protected readonly armor = ARMOR_LABELS;
  protected readonly empty = EMPTY;
  protected readonly integer = integer;
}
