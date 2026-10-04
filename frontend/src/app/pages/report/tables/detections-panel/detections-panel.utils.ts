import { formatValue, integer } from '@core/format/value-format.utils';
import { Detections, Link, Repetition } from '@core/report/detections.model';
import { Rate } from '@core/report/rate.model';

import {
  ALL_MAPS_SCOPE,
  MAX_DETECTIONS_PER_GROUP,
  REPETITION_ORDER,
} from './detections-panel.constants';
import { DetectionGroup, DetectionItem } from './detections-panel.model';

function pct(value: number | null | undefined): string {
  return formatValue(value ?? null, 'pct');
}

function rate(r: Rate | null | undefined): string {
  return pct(r?.value);
}

/** First deaths in one spot, a repeated cause of lost rounds, a situation lost again and again. */
export function repetitionItem(r: Repetition, index: number): DetectionItem {
  let detail: string | null = null;
  if (r.kind === 'zone_first_deaths') {
    detail = `${pct(r.share)} des first deaths du side, top ranked ${pct(r.topShare)}`;
  } else if (r.kind === 'situation_lost') {
    detail = `${pct(r.lostShare)} de ces rounds perdus, adversaires ${pct(r.oppLostShare)}`;
  }
  return {
    key: `rep-${index}`,
    art: r.art,
    scope: r.scope && r.scope !== ALL_MAPS_SCOPE ? r.scope : null,
    title: r.label,
    detail,
    sample: `Sur ${integer(r.baseRounds)} rounds, ${r.matches} matchs`,
    rewatch: r.rewatch,
  };
}

/** How the round result moves with a player's first blood, first death or ACS. */
export function linkItem(l: Link, index: number): DetectionItem {
  const chance = l.pValue < 0.05 ? '' : ', écart compatible avec le hasard';
  let detail: string;
  let sample: string | null = null;
  if (l.kind === 'acs_median') {
    detail =
      `${rate(l.above?.rounds)} des rounds gagnés au-dessus de son ACS médian ` +
      `(${integer(l.medianAcs ?? 0)}), ${rate(l.below?.rounds)} en dessous${chance}`;
    sample = `Sur ${(l.above?.matches ?? 0) + (l.below?.matches ?? 0)} matchs`;
  } else {
    detail = `${rate(l.value)} contre ${rate(l.team)} pour ses coéquipiers${chance}`;
    sample = l.value ? `Sur ${integer(l.value.total)} rounds` : null;
  }
  return {
    key: `link-${index}`,
    art: l.art,
    scope: l.player,
    title: l.label,
    detail,
    sample,
    rewatch: l.rewatch,
  };
}

/** The panel's two lists, each cut to its first items; empty lists are left out. */
export function detectionGroups(detections: Detections): DetectionGroup[] {
  const repetitions = [...detections.repetitions].sort(
    (a, b) => REPETITION_ORDER[a.kind] - REPETITION_ORDER[b.kind],
  );
  const groups: DetectionGroup[] = [
    {
      key: 'repetitions',
      title: 'Ce qui se répète',
      help: 'detRepeat',
      items: repetitions.slice(0, MAX_DETECTIONS_PER_GROUP).map(repetitionItem),
    },
    {
      key: 'links',
      title: 'Liens entre chiffres',
      help: 'detLink',
      items: detections.links.slice(0, MAX_DETECTIONS_PER_GROUP).map(linkItem),
    },
  ];
  return groups.filter((g) => g.items.length > 0);
}
