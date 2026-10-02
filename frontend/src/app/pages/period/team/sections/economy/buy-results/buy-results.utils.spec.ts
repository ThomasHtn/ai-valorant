import { Rate } from '@core/common/common.model';
import { BuyType } from '@core/common/enums.model';
import { BuyMatchup, Economy } from '@core/periods/team.model';

import { buyResultGroups } from './buy-results.utils';

function rate(count: number, total: number): Rate {
  return { count, total, value: total ? count / total : null };
}

function cell(ownBuy: BuyType, oppBuy: BuyType, squad: Rate, top: Rate): BuyMatchup {
  return { ownBuy, oppBuy, squad, top };
}

const ECONOMY: Economy = {
  pistols: [
    { side: 'att', squad: rate(11, 27), top: rate(50, 100) },
    { side: 'def', squad: rate(10, 27), top: rate(50, 100) },
  ],
  afterPistol: [],
  buyMatrix: [
    cell('eco', 'eco', rate(0, 0), rate(50, 100)),
    cell('eco', 'full', rate(3, 4), rate(10, 100)),
    cell('force', 'full', rate(12, 50), rate(33, 100)),
  ],
  buyShares: [],
};

describe('buyResultGroups', () => {
  it('lists pistols by side, then each buy against the ones it met', () => {
    const groups = buyResultGroups(ECONOMY);
    expect(groups.map((g) => g.label)).toEqual(['Pistol', 'Eco', 'Force buy']);
    expect(groups[0].lines.map((l) => l.label)).toEqual(['En attaque', 'En défense']);
    expect(groups[1].lines.map((l) => l.label)).toEqual(['contre full buy']);
  });

  it('reads each line against the top ranked and mutes small samples', () => {
    const [pistols, eco, force] = buyResultGroups(ECONOMY);
    expect(pistols.lines[0].rating).toBe('bad');
    expect(pistols.lines[0].gap).toBe('-9 pts');
    expect(eco.lines[0].muted).toBe(true);
    expect(eco.lines[0].rating).toBe('unknown');
    expect(force.lines[0].gap).toBe('-9 pts');
  });
});
