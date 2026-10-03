import { Reference } from '@core/common/enums.model';
import { REFERENCE_SHORT_LABELS } from '@core/format/labels.constants';
import { formatValue, integer } from '@core/format/value-format.utils';
import { HeadlineStat, OpeningDuels } from '@core/report/players.model';
import { referenceValue } from '@core/report/tone.utils';

import { PANEL_MIN_SAMPLE } from '../players.constants';
import { figureColumn, figureTone } from '../players.utils';
import {
  RADAR_AXIS_LABELS,
  RADAR_BOX,
  RADAR_RATIO,
  RADAR_RINGS,
  RADAR_SQUAD_COLOUR,
  RADAR_TONE_COLOURS,
} from './profile-radar.constants';
import {
  RadarAxisView,
  RadarPoint,
  RadarSeries,
  RadarStat,
  RadarView,
} from './profile-radar.model';

/**
 * Axes of a player's radar: his headline figures, plus his opening duels won when his role's figures
 * do not already hold them (duellists), so every role gets the same entry duel axis.
 */
export function radarStats(headline: readonly HeadlineStat[], duels: OpeningDuels): RadarStat[] {
  const stats: RadarStat[] = headline.map((h) => ({
    // Same metric as the entry duels of other roles, so players of any role share the axis.
    key: h.key === 'openingWon' ? 'duelsWon' : h.key,
    label: h.label,
    format: h.format,
    better: h.better,
    min: h.min,
    cell: h.cell,
  }));
  if (!stats.some((s) => s.key === 'duelsWon')) {
    stats.push({
      key: 'duelsWon',
      label: 'Premiers duels gagnés',
      format: 'pct',
      better: 1,
      min: PANEL_MIN_SAMPLE,
      cell: duels.duelsWon,
    });
  }
  return stats;
}

/**
 * How the player compares with the reference, 1 meaning equal: player / reference for a figure where
 * higher is better, reference / player otherwise, so above 1 is always better. Null without both.
 */
export function radarRatio(value: unknown, reference: unknown, better: number): number | null {
  if (typeof value !== 'number' || typeof reference !== 'number') {
    return null;
  }
  if (better >= 0) {
    return reference === 0 ? null : value / reference;
  }
  // Lower is better: a zero is the best possible value, drawn at the rim.
  return value === 0 ? RADAR_RATIO.max : reference / value;
}

/** Distance from the centre, 0..1, of a ratio; the reference ring sits halfway. */
export function radarReach(ratio: number): number {
  const clamped = Math.min(RADAR_RATIO.max, Math.max(RADAR_RATIO.min, ratio));
  return (clamped - RADAR_RATIO.min) / (RADAR_RATIO.max - RADAR_RATIO.min);
}

/** '15 % mieux que la référence' from a ratio of 1,15; 'Comme la référence' within 1 %. */
export function ratioText(ratio: number): string {
  const percent = Math.round(Math.abs(ratio - 1) * 100);
  if (percent < 1) {
    return 'Comme la référence';
  }
  return `${percent} % ${ratio > 1 ? 'mieux' : 'moins bien'} que la référence`;
}

const round1 = (n: number): number => Math.round(n * 10) / 10;

/** Polygon points of a ring of the web, at a given reach (0..1), one corner per axis. */
function ringPoints(count: number, reach: number, cx: number, cy: number): string {
  return Array.from({ length: count }, (_, i) => {
    const angle = axisAngle(i, count);
    return `${round1(cx + Math.cos(angle) * RADAR_BOX.radius * reach)},${round1(cy + Math.sin(angle) * RADAR_BOX.radius * reach)}`;
  }).join(' ');
}

/** Angle of an axis, the first one pointing up, then clockwise. */
function axisAngle(index: number, count: number): number {
  return -Math.PI / 2 + (index * 2 * Math.PI) / count;
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
  const first = sin < -0.3 ? y - 18 : sin > 0.3 ? y + 12 : y - 4;
  const alone = sin < -0.3 ? y - 2 : sin > 0.3 ? y + 12 : y + 5;
  return { labelY: round1(first), valueY: round1(first + 17), nameY: round1(alone) };
}

/** One player's point on an axis: placed by his ratio to the reference, with its tip. */
function radarPoint(
  stat: RadarStat,
  series: RadarSeries,
  reference: Reference,
  colours: boolean,
  axis: { cx: number; cy: number; cos: number; sin: number },
): RadarPoint {
  const column = figureColumn(stat.key, stat.label, stat.format, stat.better, stat.min);
  const tone = figureTone(stat.cell, column, reference, colours);
  const refValue = referenceValue(stat.cell, reference).value;
  const ratio = radarRatio(stat.cell.v, refValue, stat.better);
  const reach = radarReach(ratio ?? 1);
  const value = formatValue(stat.cell.v, stat.format);
  const sample = stat.cell.n ? ` sur ${integer(stat.cell.n)}` : '';
  return {
    x: round1(axis.cx + axis.cos * RADAR_BOX.radius * reach),
    y: round1(axis.cy + axis.sin * RADAR_BOX.radius * reach),
    fill: series.colour ?? RADAR_TONE_COLOURS[tone ?? 'none'],
    value,
    faint: ratio === null || tone === 'small',
    tip: {
      title: `${series.name} · ${stat.label}`,
      lines: [
        { label: series.name, value: `${value}${sample}` },
        {
          label: REFERENCE_SHORT_LABELS[reference],
          value: formatValue(refValue ?? null, stat.format),
        },
      ],
      note:
        tone === 'small'
          ? 'Échantillon trop petit pour conclure'
          : ratio === null
            ? 'Pas de référence'
            : ratioText(ratio),
    },
  };
}

/**
 * Radar of one or several players against one reference: one spoke per figure they all have, each
 * player's point placed by how much better or worse than the reference he is (the dashed middle
 * ring). A figure with no reference sits on the reference ring, hollow. Players of different roles
 * share only their common figures; each is compared with players of his own role.
 */
export function buildRadar(
  series: readonly RadarSeries[],
  reference: Reference,
  colours: boolean,
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
          colours,
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
    rings: RADAR_RINGS.map((ratio) => ({
      points: ringPoints(keys.length, radarReach(ratio), cx, cy),
      reference: ratio === 1,
    })),
  };
}
