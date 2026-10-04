import { Reference } from '@core/common/enums.model';
import { formatValue, integer } from '@core/format/value-format.utils';
import { referenceValue } from '@core/report/tone.utils';

import { PlayerFigure } from '../players-figure.model';
import { VERDICT_ITEMS } from '../players.constants';
import { figureColumn, figureTone } from '../players.utils';
import { sampleText } from '../stat-bars/stat-bars.utils';
import { PlayerVerdict, VerdictItem } from './player-verdict.model';

/**
 * '10 points de moins que les initiateurs des équipes affrontées (68 %)': the gap in points for a
 * rate, in percent of the reference for a mean.
 */
export function gapSentence(
  value: number,
  reference: number,
  isRate: boolean,
  who: string,
): string {
  const more = value > reference;
  const size = isRate
    ? Math.round(Math.abs(value - reference) * 100)
    : Math.round((Math.abs(value - reference) / Math.abs(reference)) * 100);
  if (size === 0) {
    return `autant que ${who}`;
  }
  const unit = isRate ? `point${size > 1 ? 's' : ''}` : '%';
  return `${integer(size)} ${unit} de ${more ? 'plus' : 'moins'} que ${who}`;
}

/**
 * The player's clearest strengths and weaknesses against the reference: figures coloured green or
 * red, ranked by their gap relative to the reference (small samples are never judged).
 */
export function playerVerdict(
  figures: readonly PlayerFigure[],
  reference: Reference,
  who: string,
): PlayerVerdict {
  const judged = figures.flatMap((f) => {
    const column = figureColumn(f.key, f.label, f.format, f.better, f.min);
    const tone = figureTone(f.cell, column, reference);
    const ref = referenceValue(f.cell, reference).value;
    if (!tone || typeof f.cell.v !== 'number' || typeof ref !== 'number' || ref === 0) {
      return [];
    }
    const weight = Math.abs(f.cell.v - ref) / Math.abs(ref);
    const sample = sampleText(f.cell.n, f.unit);
    const item: VerdictItem = {
      key: f.key,
      label: f.label,
      value: formatValue(f.cell.v, f.format),
      tone,
      sentence:
        `${gapSentence(f.cell.v, ref, f.format === 'pct', who)} (${formatValue(ref, f.format)})` +
        (sample ? `, ${sample}.` : '.'),
    };
    return [{ item, weight }];
  });
  const pick = (tone: 'good' | 'bad'): VerdictItem[] =>
    judged
      .filter((j) => j.item.tone === tone)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, VERDICT_ITEMS)
      .map((j) => j.item);
  const count = (tone: 'good' | 'avg' | 'bad'): number =>
    judged.filter((j) => j.item.tone === tone).length;
  return {
    strengths: pick('good'),
    weaknesses: pick('bad'),
    counts: { good: count('good'), avg: count('avg'), bad: count('bad') },
  };
}
