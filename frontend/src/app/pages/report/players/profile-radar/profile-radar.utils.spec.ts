import { describe, expect, it } from 'vitest';

import { HeadlineStat, OpeningDuels } from '@core/report/players.model';

import { RadarSeries } from './profile-radar.model';
import { buildRadar, radarRatio, radarReach, radarStats, ratioText } from './profile-radar.utils';

function stat(key: string, v: number, opp: number, better = 1): HeadlineStat {
  return {
    key,
    label: key,
    format: 'dec2',
    better,
    help: '',
    unit: 'rounds',
    min: 20,
    cell: { v, n: 100, opp, oppN: 100 },
  };
}

const duels: OpeningDuels = {
  firstBloods: 10,
  firstDeaths: 10,
  duelsWon: { v: 0.5, n: 20, opp: 0.5, oppN: 100 },
  wonAfterFirstBlood: { v: null },
  wonAfterFirstDeath: { v: null },
};

describe('profile radar', () => {
  it('reads every ratio so that above 1 is better', () => {
    expect(radarRatio(1.2, 1, 1)).toBeCloseTo(1.2);
    expect(radarRatio(0.4, 0.5, -1)).toBeCloseTo(1.25);
    expect(radarRatio(0, 0.5, -1)).toBe(1.4);
    expect(radarRatio(null, 1, 1)).toBeNull();
    expect(radarRatio(1, 0, 1)).toBeNull();
  });

  it('puts the reference halfway and clamps at the centre and the rim', () => {
    expect(radarReach(1)).toBeCloseTo(0.5);
    expect(radarReach(0.2)).toBe(0);
    expect(radarReach(3)).toBe(1);
  });

  it('writes the gap to the reference in plain words', () => {
    expect(ratioText(1.15)).toBe('15 % mieux que la référence');
    expect(ratioText(0.8)).toBe('20 % moins bien que la référence');
    expect(ratioText(1.004)).toBe('Comme la référence');
  });

  it('adds the entry duels axis once, whatever the role', () => {
    const initiator = radarStats([stat('acs', 200, 180)], duels);
    expect(initiator.map((s) => s.key)).toEqual(['acs', 'duelsWon']);
    const duelist = radarStats([stat('acs', 200, 180), stat('openingWon', 0.6, 0.5)], duels);
    expect(duelist.map((s) => s.key)).toEqual(['acs', 'duelsWon']);
  });

  it('keeps only the axes every compared player has', () => {
    const one: RadarSeries = {
      name: 'A',
      colour: 'blue',
      stats: radarStats(
        [stat('acs', 1, 1), stat('kd', 1, 1), stat('adr', 1, 1), stat('fb', 1, 1)],
        duels,
      ),
    };
    const two: RadarSeries = {
      name: 'B',
      colour: 'orange',
      stats: radarStats(
        [stat('acs', 1, 1), stat('kd', 1, 1), stat('adr', 1, 1), stat('fd', 1, 1, -1)],
        duels,
      ),
    };
    const view = buildRadar([one, two], 'opp', true);
    expect(view?.axes.map((a) => a.key)).toEqual(['acs', 'kd', 'adr', 'duelsWon']);
    expect(view?.shapes.map((s) => s.colour)).toEqual(['blue', 'orange']);
    expect(view?.rings.filter((r) => r.reference)).toHaveLength(1);
  });

  it('draws nothing under three axes', () => {
    const series: RadarSeries = { name: 'A', colour: null, stats: radarStats([], duels) };
    expect(buildRadar([series], 'opp', true)).toBeNull();
  });
});
