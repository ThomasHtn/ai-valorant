import { formatValue } from '@core/format/value-format.utils';
import { signedRounds } from '@core/report/gap.utils';
import { MapGap, Situation } from '@core/report/squad.model';

import { dashTone, roundsPill } from './dash.utils';
import { HABIT_MIN_MAPS, REWATCH_BUYS, STRONG_ROUNDS } from './squad.constants';
import { HabitReading, HabitRow, MapCell, RewatchLink, SituationPlayerLine } from './squad.model';
import { gapTip } from './tips.utils';

/** Each map of a situation as a painted cell, the detail in its tip. */
export function mapCells(label: string, maps: readonly MapGap[]): MapCell[] {
  return maps.map((m) => {
    const tone = dashTone(m.gap);
    return {
      map: m.mapName,
      text: tone === 'thin' ? '–' : signedRounds(m.gap.rounds),
      tone,
      strong: (tone === 'good' || tone === 'bad') && Math.abs(m.gap.rounds ?? 0) >= STRONG_ROUNDS,
      tip: gapTip(`${label} sur ${m.mapName}`, m.gap),
    };
  });
}

/** Red on many maps: a habit; red on a few: the worst of them; else nothing clear. */
export function habitReading(maps: readonly MapGap[]): HabitReading {
  const losing = maps
    .filter((m) => dashTone(m.gap) === 'bad')
    .sort((a, b) => (a.gap.rounds ?? 0) - (b.gap.rounds ?? 0));
  if (losing.length >= HABIT_MIN_MAPS) {
    return { kind: 'habit', text: `Habitude, ${losing.length} cartes sur ${maps.length}` };
  }
  return losing.length
    ? { kind: 'map', text: `Surtout ${losing[0].mapName}` }
    : { kind: 'none', text: 'Aucune carte nette' };
}

/** Situations map by map, in the order given (the priorities, costliest first). */
export function habitRows(situations: readonly Situation[]): HabitRow[] {
  return situations.map((s) => ({
    key: s.key,
    label: s.label,
    rounds: roundsPill(s.gap),
    cells: mapCells(s.label, s.maps),
    reading: habitReading(s.maps),
  }));
}

/** Players of a situation a single player decides, the costliest first. */
export function playerLines(s: Situation): SituationPlayerLine[] {
  return s.players.map((p) => {
    const gap = { k: p.k, n: p.n, top: p.top, topN: 0, rounds: p.cost };
    return {
      name: p.name,
      portrait: p.portrait,
      played: p.n,
      rate: formatValue(p.n ? p.k / p.n : null, 'pct'),
      top: formatValue(p.top, 'pct'),
      tone: dashTone(gap),
      rounds: roundsPill(gap),
      tip: {
        title: `${p.name}, ${s.label.toLowerCase()}`,
        lines: [
          {
            label: p.name,
            value: `${formatValue(p.n ? p.k / p.n : null, 'pct')} (${p.k} sur ${p.n})`,
          },
          { label: `Top ranked, ${p.role.toLowerCase()}`, value: formatValue(p.top, 'pct') },
          { label: 'Rounds', value: `${signedRounds(p.cost)} rounds` },
        ],
        note: 'Rounds : ce que valent ces duels gagnés ou perdus en plus, au prix du top ranked.',
      },
    };
  });
}

/** The Rounds view filtered on this buy's lost rounds; null when no filter says the situation exactly. */
export function rewatchLink(s: Situation): RewatchLink | null {
  const buy = REWATCH_BUYS[s.key];
  const lost = s.gap.n - s.gap.k;
  if (!buy || !lost) {
    return null;
  }
  return {
    label: `Revoir les ${lost} rounds ${s.label.toLowerCase()} perdus`,
    params: { buy, result: 'lost' },
  };
}
