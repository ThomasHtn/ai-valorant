import { formatValue } from '@core/format/value-format.utils';
import { GAP_MIN_SAMPLE } from '@core/report/gap.constants';
import { gapTone, signedRounds, volume } from '@core/report/gap.utils';
import { PlayerSituation } from '@core/report/players.model';
import { Gap } from '@core/report/squad.model';

import { SituationLine } from './player-situations.model';

/** A situation read the right way up: for a lower-is-better rate, the misses are the successes. */
function asGap(s: PlayerSituation): Gap {
  const flipped = s.better < 0;
  return {
    k: flipped ? s.n - s.k : s.k,
    n: s.n,
    top: s.top === null ? null : flipped ? 1 - s.top : s.top,
    topN: 0,
    rounds: s.cost,
  };
}

export function situationLines(situations: readonly PlayerSituation[]): SituationLine[] {
  return [...situations]
    .sort(
      (a, b) =>
        Number(a.n < GAP_MIN_SAMPLE) - Number(b.n < GAP_MIN_SAMPLE) ||
        (a.cost ?? 0) - (b.cost ?? 0),
    )
    .map((s) => {
      const rate = s.n ? s.k / s.n : null;
      return {
        key: s.key,
        label: s.label,
        detail: s.detail,
        volume: volume(asGap(s)).replace(/^\d+/, String(s.k)),
        rate,
        rateText: formatValue(rate, 'pct'),
        top: s.top,
        tone: gapTone(asGap(s)),
        gap: `${signedRounds(s.gap)} ${s.unit}`,
        cost: signedRounds(s.cost),
        thin: s.n < GAP_MIN_SAMPLE,
      };
    });
}

/** The sheet's answer: what costs him the most, and his best situation. */
export function playerLead(
  lines: readonly SituationLine[],
  situations: readonly PlayerSituation[],
  reference: string,
): { lead: string; rest: string } | null {
  const solid = situations.filter((s) => s.n >= GAP_MIN_SAMPLE && s.cost !== null);
  if (!solid.length) {
    return null;
  }
  const worst = solid.reduce((a, b) => ((b.cost ?? 0) < (a.cost ?? 0) ? b : a));
  const best = solid.reduce((a, b) => ((b.cost ?? 0) > (a.cost ?? 0) ? b : a));
  const lead =
    (worst.cost ?? 0) < 0
      ? `Ce qui lui coûte le plus : ${worst.label.toLowerCase()}, ${signedRounds(worst.gap)} ${worst.unit} face au ${reference}, soit environ ${signedRounds(worst.cost)} rounds sur la période.`
      : `Aucune situation ne lui coûte de rounds face au ${reference}.`;
  const rest =
    best !== worst && (best.cost ?? 0) > 0
      ? `Son point fort : ${best.label.toLowerCase()}, environ ${signedRounds(best.cost)} rounds.`
      : '';
  return lines.length ? { lead, rest } : null;
}
