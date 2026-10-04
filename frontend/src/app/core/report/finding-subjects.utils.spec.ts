import { describe, expect, it } from 'vitest';

import {
  detailLabel,
  findingLinks,
  fiveStackCaveat,
  groupBySubject,
  higherIsBetter,
  mainCauses,
  referenceText,
  verdictText,
} from './finding-subjects.utils';
import { Finding } from './findings.model';

const rate = (count: number, total: number) => ({ count, total, value: count / total });

function finding(overrides: Partial<Finding>): Finding {
  return {
    side: 'weak',
    group: 'team',
    scope: 'Split',
    metric: 'Rounds gagnés',
    kind: 'rounds',
    art: null,
    mapName: 'Split',
    scopeSide: null,
    player: null,
    reference: 'top',
    squad: rate(44, 110),
    opp: rate(66, 110),
    top: rate(50, 100),
    leverage: 1,
    gapRounds: -11,
    pValue: 0.04,
    status: 'lead',
    matches: 5,
    lostCauses: {},
    rewatch: [],
    ...overrides,
  };
}

describe('groupBySubject', () => {
  it('puts the overlapping findings of a map under its costliest one', () => {
    const split = finding({});
    const splitDefense = finding({ scope: 'Split · défense', scopeSide: 'def', gapRounds: -8.5 });
    const lotus = finding({ scope: 'Lotus', mapName: 'Lotus', gapRounds: -9 });
    const subjects = groupBySubject([splitDefense, lotus, split]);
    expect(subjects.map((s) => s.lead.scope)).toEqual(['Split', 'Lotus']);
    expect(subjects[0].others).toEqual([splitDefense]);
  });

  it('groups a player by name whatever the side', () => {
    const player = { group: 'players' as const, mapName: null, player: 'Alpha' };
    const subjects = groupBySubject([
      finding({ ...player, scope: 'Alpha', gapRounds: -9 }),
      finding({ ...player, scope: 'Alpha · défense', gapRounds: -4.5 }),
    ]);
    expect(subjects).toHaveLength(1);
    expect(detailLabel(subjects[0].others[0])).toBe('Défense, rounds gagnés');
  });

  it('keeps the findings that share their rounds under one subject', () => {
    const global = { mapName: null };
    const subjects = groupBySubject([
      finding({ ...global, scope: 'Global', metric: 'First blood pris', gapRounds: -6 }),
      finding({
        ...global,
        scope: 'Global · 5v4',
        metric: 'Rounds gagnés après un 5v4',
        gapRounds: -4,
      }),
      finding({ ...global, scope: 'Full buy', kind: 'roundType', gapRounds: -5 }),
      finding({ ...global, scope: 'Full buy contre eco', kind: 'roundType', gapRounds: -3 }),
    ]);
    expect(subjects.map((s) => [s.key, s.others.length])).toEqual([
      ['scope:Global', 1],
      ['scope:Types de round', 1],
    ]);
    expect(detailLabel(subjects[0].others[0])).toBe('5v4, rounds gagnés après un 5v4');
    expect(detailLabel(subjects[1].lead)).toBe('Full buy, rounds gagnés');
  });

  it('writes per round rates like the tables', () => {
    const fd = finding({ kind: 'firstDeath', squad: rate(14, 100), top: rate(10, 100) });
    expect(referenceText(fd)).toBe('0,14 contre 0,10 au top ranked');
  });
});

describe('finding texts', () => {
  it('writes the metric alone when the scope is the subject', () => {
    expect(detailLabel(finding({}))).toBe('Rounds gagnés');
  });

  it('says why a gap is good or bad, whichever way the metric reads', () => {
    expect(higherIsBetter(finding({}))).toBe(true);
    expect(verdictText(finding({}))).toEqual({
      comparison: 'Moins de rounds gagnés que le top ranked',
      better: 1,
    });
    const noDamage = finding({
      side: 'strong',
      metric: 'Morts sans dégâts',
      squad: rate(28, 100),
      top: rate(36, 100),
    });
    expect(higherIsBetter(noDamage)).toBe(false);
    expect(verdictText(noDamage)).toEqual({
      comparison: 'Moins de morts sans dégâts que le top ranked',
      better: -1,
    });
    expect(verdictText(finding({ reference: 'opp', metric: 'ACS' })).comparison).toBe(
      'Moins de ACS que les adversaires',
    );
  });

  it('lists the main causes of the lost rounds, most frequent first', () => {
    const f = finding({
      lostCauses: { duels_lost: 2, retake_failed: 3, clutch_lost: 1, time_out: 1 },
    });
    expect(mainCauses(f)).toBe(
      'Retake raté (3 rounds), duels perdus (2 rounds), clutch perdu (1 round)',
    );
    expect(mainCauses(finding({}))).toBeNull();
  });

  it('warns that a revenge strength against opponents may be the 5-stack edge', () => {
    const revenge = finding({
      side: 'strong',
      kind: 'revenge',
      reference: 'opp',
      squad: rate(18, 100),
      top: rate(16, 100),
    });
    expect(fiveStackCaveat(revenge)).toContain('Face au top ranked : 18 % contre 16 %.');
    expect(fiveStackCaveat(finding({}))).toBeNull();
  });
});

describe('findingLinks', () => {
  it('opens the lost rounds and the minimap of the map and side', () => {
    const links = findingLinks(finding({ scopeSide: 'def' }));
    expect(links).toEqual([
      {
        label: 'Rounds perdus',
        commands: ['/report/rounds'],
        queryParams: { map: 'Split', side: 'def', result: 'lost' },
      },
      { label: 'Minimap', commands: ['/report/minimap', 'Split'], queryParams: { side: 'def' } },
    ]);
  });

  it('opens the player sheet for a player finding', () => {
    const links = findingLinks(finding({ mapName: null, player: 'Alpha', side: 'strong' }));
    expect(links.map((l) => l.label)).toEqual(['Rounds gagnés', 'Fiche joueur']);
    expect(links[0].queryParams).toEqual({ player: 'Alpha', result: 'won' });
  });

  it('gives a global finding no rounds link', () => {
    expect(findingLinks(finding({ mapName: null, scope: 'Global' }))).toEqual([]);
  });
});
