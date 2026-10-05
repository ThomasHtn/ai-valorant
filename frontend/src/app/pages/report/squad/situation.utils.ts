import { formatValue } from '@core/format/value-format.utils';
import { byCost, isThin, signedRounds, volume } from '@core/report/gap.utils';
import { MapGap, Situation } from '@core/report/squad.model';

import { dashTone, pointsText, rateText, roundsPill } from './dash.utils';
import { BUY_COLORS, BUY_ORDER } from './squad.constants';
import { gapTip } from './tips.utils';
import { habitReading, mapCells, playerLines, rewatchLink } from './habit.utils';
import { BuyShare, LostSplit, MapPick, MapPickMode, SituationLine } from './squad.model';

/** A situation as a table line; `mode` names its worst or best map. */
export function situationLine(s: Situation, mode: MapPickMode | null = null): SituationLine {
  return {
    key: s.key,
    label: s.label,
    tip: s.detail
      ? { title: s.label, text: `${s.detail.charAt(0).toUpperCase()}${s.detail.slice(1)}.` }
      : null,
    played: s.gap.n,
    won: s.gap.k,
    rate: rateText(s.gap),
    gapTip: gapTip(
      s.label,
      s.gap,
      s.detail ? `${s.detail.charAt(0).toUpperCase()}${s.detail.slice(1)}.` : undefined,
    ),
    top: formatValue(s.gap.top, 'pct'),
    points: pointsText(s.gap),
    tone: dashTone(s.gap),
    rounds: roundsPill(s.gap),
    thin: isThin(s.gap),
    pick: mode ? mapPick(s.maps, mode) : null,
    maps: mapCells(s.label, s.maps),
    reading: habitReading(s.maps),
    players: playerLines(s),
    rewatch: rewatchLink(s),
  };
}

/**
 * The map where a line costs most (or pays most), among maps with a readable sample; the tip lists
 * every map so the whole breakdown stays one hover away.
 */
export function mapPick(maps: readonly MapGap[], mode: MapPickMode): MapPick {
  const readable = maps.filter((m) => dashTone(m.gap) === (mode === 'worst' ? 'bad' : 'good'));
  const sign = mode === 'worst' ? 1 : -1;
  const pick = [...readable].sort((a, b) => sign * ((a.gap.rounds ?? 0) - (b.gap.rounds ?? 0)))[0];
  const tip = maps.length
    ? {
        title: 'Carte par carte',
        lines: [...maps]
          .sort((a, b) => (a.gap.rounds ?? 0) - (b.gap.rounds ?? 0))
          .map((m) => ({
            label: m.mapName,
            value: isThin(m.gap)
              ? `${volume(m.gap)}, trop peu`
              : `${signedRounds(m.gap.rounds)} rounds (${volume(m.gap)})`,
          })),
        note: 'Écart en rounds face au top ranked sur la même carte.',
      }
    : null;
  return pick
    ? { map: pick.mapName, rounds: signedRounds(pick.gap.rounds), tone: dashTone(pick.gap), tip }
    : { map: null, rounds: '–', tone: 'thin', tip };
}

/** Situations costing rounds, the costliest first, thin ones last. */
export function priorityList(situations: readonly Situation[]): Situation[] {
  return byCost(
    situations.filter((s) => (s.gap.rounds ?? 0) < 0),
    (s) => s.gap,
  );
}

export function priorities(situations: readonly Situation[]): SituationLine[] {
  return priorityList(situations).map((s) => situationLine(s, 'worst'));
}

/** Situations winning rounds, the best first, thin ones last. */
export function strengths(situations: readonly Situation[]): SituationLine[] {
  return situations
    .filter((s) => (s.gap.rounds ?? 0) > 0)
    .sort(
      (a, b) =>
        Number(isThin(a.gap)) - Number(isThin(b.gap)) || (b.gap.rounds ?? 0) - (a.gap.rounds ?? 0),
    )
    .map((s) => situationLine(s, 'best'));
}

/** Buys in their fixed order. */
export function economyLines(situations: readonly Situation[]): SituationLine[] {
  return BUY_ORDER.map((key) => situations.find((s) => s.key === key))
    .filter((s): s is Situation => !!s)
    .map((s) => situationLine(s, signedPick(s)));
}

/** The map a line names: where it costs most when it loses rounds, where it pays most otherwise. */
function signedPick(s: Situation): MapPickMode {
  return (s.gap.rounds ?? 0) < 0 ? 'worst' : 'best';
}

/** Opening and clutch situations, the costliest first. */
export function openingLines(situations: readonly Situation[]): SituationLine[] {
  return byCost(
    situations.filter((s) => s.group === 'opening'),
    (s) => s.gap,
  ).map((s) => situationLine(s, signedPick(s)));
}

/** Share of the played rounds per buy (the bonus round is a full or force buy already counted). */
export function buyShares(situations: readonly Situation[], played: number): BuyShare[] {
  return Object.keys(BUY_COLORS)
    .map((key) => situations.find((s) => s.key === key))
    .filter((s): s is Situation => !!s)
    .map((s) => ({
      key: s.key,
      label: s.label,
      rounds: s.gap.n,
      share: formatValue(played ? s.gap.n / played : null, 'pct'),
      color: BUY_COLORS[s.key],
    }));
}

/** Lost rounds after a first death (4 against 5 not recovered) and despite a first blood (5 against 4 thrown). */
export function lostSplit(situations: readonly Situation[]): LostSplit | null {
  const recovery = situations.find((s) => s.key === 'recovery');
  const conversion = situations.find((s) => s.key === 'conversion');
  if (!recovery || !conversion) {
    return null;
  }
  const afterDeath = recovery.gap.n - recovery.gap.k;
  const despiteBlood = conversion.gap.n - conversion.gap.k;
  return {
    lost: afterDeath + despiteBlood,
    afterDeath,
    despiteBlood,
    recoveryRate: rateText(recovery.gap),
    recoveryTop: formatValue(recovery.gap.top, 'pct'),
    conversionRate: rateText(conversion.gap),
    conversionTop: formatValue(conversion.gap.top, 'pct'),
  };
}
