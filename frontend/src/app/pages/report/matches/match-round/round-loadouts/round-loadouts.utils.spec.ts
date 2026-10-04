import { teamLoadout } from './round-loadouts.utils';

describe('teamLoadout', () => {
  it('sums the team value and writes each buy', () => {
    const team = teamLoadout("L'escouade", [
      {
        name: 'A',
        agent: 'Jett',
        loadout: 4600,
        weapon: 'Vandal',
        armor: 'Heavy Armor',
        remaining: 300,
      },
      { name: 'B', agent: 'Sova', loadout: 800, weapon: null, armor: null, remaining: 3000 },
    ]);
    expect(team.total).toMatch(/^5\s400\scrédits$/u);
    expect(team.lines[0]).toMatchObject({
      weapon: 'Vandal',
      armor: 'Lourde',
      armorIcon: 'assets/valorant/armors/heavy-armor.webp',
    });
    expect(team.lines[0].value).toMatch(/^4\s600$/u);
    expect(team.lines[1].weapon).toBe('—');
    expect(team.lines[1].armorIcon).toBeNull();
    expect(team.lines[1].tip.lines?.[3].value).toMatch(/^3\s000\scrédits$/u);
  });
});
