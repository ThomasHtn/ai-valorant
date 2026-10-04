import { AgentRole } from '@core/game-assets/game-assets.model';
import { ROLE_LABELS } from '@core/game-assets/game-assets.constants';
import { Distribution, Histogram } from '@core/report/distributions.model';
import { withUnit } from '@shared/histogram/histogram.utils';

import { DISTRIBUTION_READINGS, SQUAD_SUBJECT } from './distribution.constants';
import { ReadingWords } from './distribution.model';

/** The two histograms on screen and how to name them. */
export interface DistributionSeries {
  squad: Histogram;
  top: Histogram;
  /** "L'escouade" or the player's name. */
  who: string;
  /** Top ranked legend: 'Top ranked' or 'Top ranked, initiateur'. */
  topLabel: string;
}

/** Histograms of the squad, or of one player against top ranked players of his role. */
export function distributionSeries(
  distribution: Distribution,
  subject: string,
): DistributionSeries {
  const player =
    subject === SQUAD_SUBJECT ? null : distribution.players?.find((p) => p.name === subject);
  if (!player) {
    return {
      squad: distribution.squad,
      top: distribution.top,
      who: "L'escouade",
      topLabel: 'Top ranked',
    };
  }
  const role = ROLE_LABELS[player.role as AgentRole] ?? player.role;
  return {
    squad: player.squad,
    top: player.top,
    who: player.name,
    topLabel: `Top ranked, ${role.toLowerCase()}`,
  };
}

/** '+2 s' / '−9 s': squad median minus top ranked median, null when one is missing. */
export function medianGap(squad: Histogram, top: Histogram, unit: string): string | null {
  if (squad.median === null || top.median === null) {
    return null;
  }
  // Gap of the medians as written, so '12 s' against '12 s' never reads '+0 s'.
  const gap = Math.round(squad.median) - Math.round(top.median);
  const sign = gap > 0 ? '+' : gap < 0 ? '−' : '';
  return `${sign}${withUnit(Math.abs(gap), unit)}`;
}

/**
 * One sentence saying what the gap of medians means in game terms ("L'escouade prend le premier
 * contact 2 s plus tard que le top ranked."); null without both medians or a template.
 */
export function readingSentence(
  key: string,
  series: DistributionSeries,
  unit: string,
): string | null {
  const template = DISTRIBUTION_READINGS[key];
  const { squad, top } = series;
  if (!template || squad.median === null || top.median === null) {
    return null;
  }
  const team = series.who === "L'escouade";
  const words: ReadingWords = {
    who: series.who,
    of: team ? "de l'escouade" : `de ${series.who}`,
    top: team ? 'le top ranked' : 'le top ranked du même rôle',
  };
  const gap = Math.round(squad.median - top.median);
  if (gap === 0) {
    return template.same(words);
  }
  const text = withUnit(Math.abs(gap), unit);
  return gap > 0 ? template.more(text, words) : template.less(text, words);
}
