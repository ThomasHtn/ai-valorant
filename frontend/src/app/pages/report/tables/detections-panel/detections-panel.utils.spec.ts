import { describe, expect, it } from 'vitest';

import { Detections, Link, Repetition } from '@core/report/detections.model';

import { detectionGroups, linkItem, repetitionItem } from './detections-panel.utils';

function repetition(overrides: Partial<Repetition>): Repetition {
  return {
    kind: 'loss_cause',
    label: 'Ouverture perdue 12 fois',
    scope: 'Lotus · attaque',
    art: null,
    mapName: 'Lotus',
    side: 'att',
    count: 12,
    matches: 4,
    baseRounds: 44,
    players: [],
    rewatch: [],
    ...overrides,
  };
}

const rate = (count: number, total: number) => ({ count, total, value: count / total });

describe('repetitionItem', () => {
  it('writes a zone repetition with its share against top ranked', () => {
    const item = repetitionItem(
      repetition({
        kind: 'zone_first_deaths',
        label: '6 first deaths à A Stairs',
        share: 0.286,
        topShare: 0.143,
      }),
      0,
    );
    expect(item.scope).toBe('Lotus · attaque');
    expect(item.title).toBe('6 first deaths à A Stairs');
    expect(item.detail).toBe('29 % des first deaths du side, top ranked 14 %');
    expect(item.sample).toBe('Sur 44 rounds, 4 matchs');
  });

  it('does not repeat the all-maps scope', () => {
    const item = repetitionItem(
      repetition({ scope: 'Toutes les cartes', label: '5v4 perdu 90 fois' }),
      0,
    );
    expect(item.scope).toBeNull();
    expect(item.title).toBe('5v4 perdu 90 fois');
  });
});

describe('linkItem', () => {
  const link: Link = {
    kind: 'first_blood',
    player: 'DuffManBzH',
    art: { type: 'player', slug: 'DuffManBzH' },
    label: 'Rounds gagnés après son first blood',
    pValue: 0.76,
    value: rate(9, 12),
    team: rate(198, 293),
    rewatch: [],
  };

  it('says when a gap can come from chance', () => {
    expect(linkItem(link, 0).detail).toBe(
      "75 % contre 68 % pour l'escouade, écart compatible avec le hasard",
    );
    expect(linkItem({ ...link, pValue: 0.01 }, 0).detail).toBe("75 % contre 68 % pour l'escouade");
  });

  it('writes the ACS link with both groups', () => {
    const acs: Link = {
      ...link,
      kind: 'acs_median',
      pValue: 0.004,
      value: null,
      medianAcs: 280.6,
      above: { rounds: rate(54, 100), matches: 13, matchWins: 8 },
      below: { rounds: rate(42, 100), matches: 14, matchWins: 4 },
    };
    expect(linkItem(acs, 0).detail).toBe(
      '54 % des rounds gagnés au-dessus de son ACS médian (281), 42 % en dessous',
    );
    expect(linkItem(acs, 0).sample).toBe('Sur 27 matchs');
  });
});

describe('detectionGroups', () => {
  it('puts zone repetitions first and drops empty lists', () => {
    const detections: Detections = {
      repetitions: [repetition({}), repetition({ kind: 'zone_first_deaths', label: 'zone' })],
      links: [],
    };
    const groups = detectionGroups(detections);
    expect(groups.map((g) => g.key)).toEqual(['repetitions']);
    expect(groups[0].items[0].title).toBe('zone');
  });
});
