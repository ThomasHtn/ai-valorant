import { describe, expect, it } from 'vitest';

import { HeadlineStat, OpeningDuels } from '@core/report/players.model';

import { RadarSeries } from './profile-radar.model';
import { buildRadar, radarStats } from './profile-radar.utils';

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
  duelsWon: { v: 0.5, n: 20, opp: 0.4, oppN: 100 },
  wonAfterFirstBlood: { v: null },
  wonAfterFirstDeath: { v: null },
};

describe('profile radar', () => {
  it('adds the entry duels axis once, whatever the role', () => {
    const initiator = radarStats([stat('acs', 200, 180)], duels);
    expect(initiator.map((s) => s.key)).toEqual(['acs', 'duelsWon']);
    const duelist = radarStats([stat('acs', 200, 180), stat('openingWon', 0.6, 0.5)], duels);
    expect(duelist.map((s) => s.key)).toEqual(['acs', 'duelsWon']);
  });

  it('draws a lone player and his reference with their own shapes', () => {
    const series: RadarSeries = {
      name: 'A',
      colour: null,
      stats: radarStats([stat('acs', 300, 100), stat('kd', 1, 1), stat('adr', 125, 125)], duels),
    };
    const view = buildRadar([series], 'opp')!;
    // ACS 300 sits at the rim, the reference's 100 at the centre.
    expect(view.axes[0].points[0].y).toBeCloseTo(view.cy - 175);
    expect(view.reference?.points.split(' ')[0]).toBe(`${view.cx},${view.cy - 7}`);
    expect(view.rings).toHaveLength(4);
  });

  it('keeps only the axes every compared player has, without a reference shape', () => {
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
    const view = buildRadar([one, two], 'opp');
    expect(view?.axes.map((a) => a.key)).toEqual(['acs', 'kd', 'adr', 'duelsWon']);
    expect(view?.shapes.map((s) => s.colour)).toEqual(['blue', 'orange']);
    expect(view?.reference).toBeNull();
  });

  it('draws nothing under three axes', () => {
    const series: RadarSeries = { name: 'A', colour: null, stats: radarStats([], duels) };
    expect(buildRadar([series], 'opp')).toBeNull();
  });
});
