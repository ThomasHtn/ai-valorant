import { formatValue } from '@core/format/value-format.utils';
import { addRounds, gapRate, mapVerdict, volume } from '@core/report/gap.utils';
import { MapReference } from '@core/report/report-meta.model';
import { Gap, MapLine as ApiMapLine } from '@core/report/squad.model';

import { dashTone, rateText, roundsPill, sumGaps } from '../dash.utils';
import { MapLine, SideCells, VerdictKey } from '../squad.model';
import { gapTip, recordTip, sidesTip } from '../tips.utils';
import { DUMBBELL } from './map-board.constants';

/** One side as drawn: rate, volume, top ranked rate and gap. */
export function sideCells(gap: Gap, title: string): SideCells {
  return {
    rate: rateText(gap),
    tip: gapTip(title, gap),
    volume: volume(gap),
    top: formatValue(gap.top, 'pct'),
    tone: dashTone(gap),
    share: gapRate(gap),
    rounds: roundsPill(gap),
  };
}

/** Attack and defense over every map. */
export function sideTotals(maps: readonly ApiMapLine[]): { attack: SideCells; defense: SideCells } {
  return {
    attack: sideCells(sumGaps(maps.map((m) => m.attack)), 'Attaque, toutes cartes'),
    defense: sideCells(sumGaps(maps.map((m) => m.defense)), 'Défense, toutes cartes'),
  };
}

/** X of a share on the dumbbell, clamped to its axis. */
export function dumbbellX(share: number | null): number {
  const clamped = Math.min(Math.max(share ?? DUMBBELL.min, DUMBBELL.min), DUMBBELL.max);
  const x =
    DUMBBELL.start + ((clamped - DUMBBELL.min) / (DUMBBELL.max - DUMBBELL.min)) * DUMBBELL.span;
  return Math.round(x * 10) / 10;
}

/** Maps by rounds lost against the top ranked, the costliest first; thin and collecting maps last. */
export function mapLines(
  maps: readonly ApiMapLine[],
  references: readonly MapReference[],
): MapLine[] {
  const collecting = new Set(references.filter((r) => r.collecting).map((r) => r.mapName));
  return maps
    .map((m) => {
      const total = sumGaps([m.attack, m.defense]);
      const rounds = addRounds(m.attack.rounds, m.defense.rounds);
      const verdict: VerdictKey = collecting.has(m.mapName)
        ? 'collecting'
        : mapVerdict(rounds, m.matches);
      const thin = verdict === 'test' || verdict === 'collecting';
      const pill = roundsPill({ ...total, rounds });
      return {
        map: m.mapName,
        matches: m.matches,
        wins: m.wins,
        losses: m.matches - m.wins,
        recordTip: recordTip(m.mapName, m.matches, m.wins, total),
        roundsTip: sidesTip(m.mapName, m.attack, m.defense, rounds),
        attack: sideCells(m.attack, `${m.mapName} en attaque`),
        defense: sideCells(m.defense, `${m.mapName} en défense`),
        rounds: thin ? { ...pill, tone: 'thin' as const, strong: false } : pill,
        verdict,
        thin,
        order: rounds ?? 0,
      };
    })
    .sort((a, b) => Number(a.thin) - Number(b.thin) || a.order - b.order)
    .map(({ order: _order, ...line }) => line);
}
