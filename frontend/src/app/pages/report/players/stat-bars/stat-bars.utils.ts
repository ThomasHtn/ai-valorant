import { Reference } from '@core/common/enums.model';
import { ValueFormat } from '@core/format/value-format.model';
import { formatValue, integer } from '@core/format/value-format.utils';
import { referenceValue } from '@core/report/tone.utils';

import { PlayerFigure } from '../players-figure.model';
import { statReach } from '../players-scale.utils';
import { figureColumn, figureTone } from '../players.utils';
import { StatBarRow } from './stat-bars.model';

/** 'sur 445 rounds' from a sample and its unit; null when unknown. */
export function sampleText(n: number | null | undefined, unit: string | null): string | null {
  return n ? `sur ${integer(n)}${unit ? ` ${unit}` : ''}` : null;
}

/**
 * Figures as attribute bars against one reference: the value coloured like a table cell, its place on
 * the figure's fixed scale, the reference's tick and value. `format` overrides how values are written
 * (credits); `bars` false keeps the lines without gauges.
 */
export function statBarRows(
  figures: readonly PlayerFigure[],
  reference: Reference,
  referenceName: string,
  options: { bars?: boolean; format?: (f: PlayerFigure) => ValueFormat } = {},
): StatBarRow[] {
  const bars = options.bars ?? true;
  return figures.map((f) => {
    const format = options.format?.(f) ?? f.format;
    const column = figureColumn(f.key, f.label, f.format, f.better, f.min);
    const ref = referenceValue(f.cell, reference).value;
    const hasRef = ref !== null && ref !== undefined;
    return {
      key: f.key,
      label: f.label,
      help: f.help,
      better: f.better,
      value: formatValue(f.cell.v, format),
      tone: figureTone(f.cell, column, reference),
      reach: bars ? statReach(f.key, f.cell.v, f.better || 1, f.format) : null,
      referenceReach: bars && hasRef ? statReach(f.key, ref, f.better || 1, f.format) : null,
      reference: hasRef ? `${referenceName} ${formatValue(ref, format)}` : null,
      sample: sampleText(f.cell.n, f.unit),
    };
  });
}

/** 'Sentinelles adverses 200, sur 576 rounds': the reference then the sample, on one line. */
export function referenceLine(row: Pick<StatBarRow, 'reference' | 'sample'>): string {
  const reference = row.reference ?? 'Pas de référence';
  return row.sample ? `${reference}, ${row.sample}` : reference;
}
