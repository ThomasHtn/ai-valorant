import { EMPTY } from '@core/format/format.utils';
import { ARMOR_LABELS } from '@core/format/round-labels.constants';
import { formatValue, integer } from '@core/format/value-format.utils';
import { armorIcon, weaponIcon } from '@core/game-assets/game-assets.utils';
import { EconomyLine } from '@core/report/rounds.model';

import { TeamLoadout } from './round-loadouts.model';

/** A team's buys at the end of the buy phase, one line per player, and its total value. */
export function teamLoadout(title: string, lines: readonly EconomyLine[]): TeamLoadout {
  const total = lines.reduce((sum, line) => sum + line.loadout, 0);
  return {
    title,
    total: formatValue(total, 'cr'),
    lines: lines.map((line) => {
      const armor = line.armor ? (ARMOR_LABELS[line.armor] ?? line.armor) : EMPTY;
      return {
        name: line.name,
        agent: line.agent,
        weapon: line.weapon ?? EMPTY,
        weaponIcon: line.weapon ? weaponIcon(line.weapon) : null,
        armor,
        armorIcon: line.armor ? armorIcon(line.armor) : null,
        value: integer(line.loadout),
        tip: {
          title: line.name,
          text: line.agent,
          lines: [
            { label: 'Arme', value: line.weapon ?? EMPTY },
            { label: 'Armure', value: armor },
            { label: "Valeur de l'équipement", value: formatValue(line.loadout, 'cr') },
            { label: 'Crédits restants', value: formatValue(line.remaining, 'cr') },
          ],
        },
      };
    }),
  };
}
