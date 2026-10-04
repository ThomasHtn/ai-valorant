import { Reference } from '@core/common/enums.model';
import { formatValue, integer } from '@core/format/value-format.utils';
import { HeadlineStat, OpeningDuels } from '@core/report/players.model';
import { referenceValue } from '@core/report/tone.utils';

import { PlayerFigure } from '../players-figure.model';
import { statReach } from '../players-scale.utils';
import { PANEL_MIN_SAMPLE } from '../players.constants';
import { figureColumn, figureTone, headlineFigure } from '../players.utils';
import {
  RADAR_AXIS_LABELS,
  RADAR_BOX,
  RADAR_REFERENCE_COLOUR,
  RADAR_RINGS,
  RADAR_SQUAD_COLOUR,
  RADAR_TONE_COLOURS,
} from './profile-radar.constants';
import { RadarAxisView, RadarPoint, RadarSeries, RadarView } from './profile-radar.model';

/**
 * A player's key figures: his headline figures, plus his opening duels won when his role's figures
 * do not already hold them (duellists), so every role gets the same entry duel axis.
 */
export function radarStats(headline: readonly HeadlineStat[], duels: OpeningDuels): PlayerFigure[] {
  const stats: PlayerFigure[] = headline.map((h) => ({
    ...headlineFigure(h),
    // Same metric as the entry duels of other roles, so players of any role share the axis.
    key: h.key === 'openingWon' ? 'duelsWon' : h.key,
  }));
  if (!stats.some((s) => s.key === 'duelsWon')) {
    stats.push({
      key: 'duelsWon',
      label: 'Premiers duels gagnés',
      help: 'playerOpeningDuels',
      format: 'pct',
      better: 1,
      min: PANEL_MIN_SAMPLE,
      unit: 'duels',
      cell: duels.duelsWon,
    });
  }
  return stats;
}

const round1 = (n: number): number => Math.round(n * 10) / 10;

/** Angle of an axis, the first one pointing up, then clockwise. */
function axisAngle(index: number, count: number): number {
  return -Math.PI / 2 + (index * 2 * Math.PI) / count;
}

/** Point at a reach (0..1) on an axis. */
function at(index: number, count: number, reach: number, cx: number, cy: number): string {
  const angle = axisAngle(index, count);
  const r = RADAR_BOX.radius * reach;
  return `${round1(cx + Math.cos(angle) * r)},${round1(cy + Math.sin(angle) * r)}`;
}

/** Text anchor of a label, by which side of the web it sits on. */
function labelAnchor(cos: number): RadarAxisView['anchor'] {
  if (Math.abs(cos) < 0.2) {
    return 'middle';
  }
  return cos > 0 ? 'start' : 'end';
}

/**
 * Name then value under it, both above the web at the top, below it at the bottom; `nameY` places
 * the name alone, when the values are written elsewhere.
 */
function labelLines(y: number, sin: number): { labelY: number; valueY: number; nameY: number } {
  const first = sin < -0.3 ? y - 20 : sin > 0.3 ? y + 14 : y - 4;
  const alone = sin < -0.3 ? y - 2 : sin > 0.3 ? y + 14 : y + 5;
  return { labelY: round1(first), valueY: round1(first + 19), nameY: round1(alone) };
}

/** One player's point on an axis: placed on the figure's fixed scale, with its tip. */
function radarPoint(
  stat: PlayerFigure,
  series: RadarSeries,
  reference: Reference,
  referenceName: string,
  axis: { cx: number; cy: number; cos: number; sin: number },
): RadarPoint {
  const column = figureColumn(stat.key, stat.label, stat.format, stat.better, stat.min);
  const tone = figureTone(stat.cell, column, reference);
  const reach = statReach(stat.key, stat.cell.v, stat.better, stat.format);
  const value = formatValue(stat.cell.v, stat.format);
  const sample = stat.cell.n ? ` sur ${integer(stat.cell.n)} ${stat.unit ?? ''}`.trimEnd() : '';
  return {
    x: round1(axis.cx + axis.cos * RADAR_BOX.radius * (reach ?? 0)),
    y: round1(axis.cy + axis.sin * RADAR_BOX.radius * (reach ?? 0)),
    fill: series.colour ?? RADAR_TONE_COLOURS[tone ?? 'none'],
    value,
    faint: reach === null || tone === 'small',
    tip: {
      title: `${series.name}, ${stat.label}`,
      lines: [
        { label: series.name, value: `${value}${sample}` },
        {
          label: referenceName,
          value: formatValue(referenceValue(stat.cell, reference).value ?? null, stat.format),
        },
      ],
      note:
        tone === 'small'
          ? 'Échantillon trop petit pour conclure'
          : stat.better < 0
            ? 'Plus bas = mieux : l’axe est inversé, plus loin du centre = mieux'
            : 'Plus loin du centre = mieux',
    },
  };
}

/**
 * Radar of one or several players: one spoke per figure they all have, each value placed on that
 * figure's fixed scale (centre = weak, rim = strong), so a player and his reference keep their real
 * shapes. A lone player gets his reference drawn as a dashed polygon; `referenceName` labels its tip.
 */
export function buildRadar(
  series: readonly RadarSeries[],
  reference: Reference,
  referenceName = 'Référence',
): RadarView | null {
  const keys = (series[0]?.stats ?? [])
    .map((s) => s.key)
    .filter((key) => series.every((one) => one.stats.some((s) => s.key === key)));
  if (keys.length < 3) {
    return null;
  }
  const { width, height, radius, labelGap } = RADAR_BOX;
  const cx = width / 2;
  const cy = height / 2;

  const axes = keys.map((key, i): RadarAxisView => {
    const angle = axisAngle(i, keys.length);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const first = series[0].stats.find((s) => s.key === key)!;
    return {
      key,
      rimX: round1(cx + cos * radius),
      rimY: round1(cy + sin * radius),
      labelX: round1(cx + cos * (radius + labelGap)),
      ...labelLines(cy + sin * (radius + labelGap), sin),
      anchor: labelAnchor(cos),
      label: RADAR_AXIS_LABELS[key] ?? first.label,
      points: series.map((one) =>
        radarPoint(
          one.stats.find((s) => s.key === key)!,
          one,
          reference,
          referenceName,
          {
            cx,
            cy,
            cos,
            sin,
          },
        ),
      ),
    };
  });

  return {
    width,
    height,
    cx,
    cy,
    axes,
    shapes: series.map((one, index) => ({
      name: one.name,
      points: axes.map((a) => `${a.points[index].x},${a.points[index].y}`).join(' '),
      colour: one.colour ?? RADAR_SQUAD_COLOUR,
    })),
    reference: series.length === 1 ? referenceShape(series[0], keys, reference, cx, cy) : null,
    rings: RADAR_RINGS.map((reach) =>
      keys.map((_, i) => at(i, keys.length, reach, cx, cy)).join(' '),
    ),
  };
}

/** The reference's own polygon on the same scales; null when one of its values is missing. */
function referenceShape(
  one: RadarSeries,
  keys: readonly string[],
  reference: Reference,
  cx: number,
  cy: number,
): RadarView['reference'] {
  const reaches = keys.map((key) => {
    const stat = one.stats.find((s) => s.key === key)!;
    return statReach(
      stat.key,
      referenceValue(stat.cell, reference).value,
      stat.better,
      stat.format,
    );
  });
  if (reaches.some((r) => r === null)) {
    return null;
  }
  return {
    name: 'Référence',
    points: reaches.map((r, i) => at(i, keys.length, r!, cx, cy)).join(' '),
    colour: RADAR_REFERENCE_COLOUR,
  };
}
