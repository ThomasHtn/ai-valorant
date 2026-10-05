import { formatValue, integer } from '@core/format/value-format.utils';
import { gapRate } from '@core/report/gap.utils';
import { Rate } from '@core/report/rate.model';
import { Gap, MonthPoint, SquadView } from '@core/report/squad.model';
import { MonthSeries, MonthTick } from '@shared/month-chart/month-chart.model';

import { dashTone } from './dash.utils';
import { FLAT_POINTS, MIN_MONTH_MATCHES, TREND_COLORS } from './squad.constants';
import { KpiDelta, RingKpi } from './squad.model';
import { rateWithVolume } from './tips.utils';

/** The four headline rings: matches, rounds, first duels and pistols, with their change. */
export function ringKpis(view: SquadView): RingKpi[] {
  const { wins, rounds, firstDuels, pistols, before } = view.kpis;
  const winGap: Gap = {
    k: wins.count,
    n: wins.total,
    top: 0.5,
    topN: 0,
    rounds: wins.count - wins.total / 2,
  };
  const matches = wins.total > 1 ? 'matchs' : 'match';
  return [
    ring('wins', 'Victoires', null, winGap, before.wins, {
      sub: `${wins.count} V, ${wins.total - wins.count} D sur ${wins.total} ${matches}`,
    }),
    ring('rounds', 'Rounds gagnés', null, rounds, before.rounds, {
      sub: `${integer(rounds.k)} gagnés, ${integer(rounds.n - rounds.k)} perdus`,
    }),
    ring('first-duels', 'Premier duel', 'firstDuels', firstDuels, before.firstDuels),
    ring('pistols', 'Pistols', null, pistols, before.pistols),
  ];
}

function ring(
  key: string,
  label: string,
  help: string | null,
  gap: Gap,
  before: Rate,
  text: { sub?: string } = {},
): RingKpi {
  const share = gapRate(gap);
  return {
    key,
    label,
    help,
    share,
    value: share === null ? '–' : integer(Math.round(share * 100)),
    tone: dashTone(gap),
    mark: gap.top,
    sub:
      text.sub ??
      `${integer(gap.k)} sur ${integer(gap.n)}, top ranked ${formatValue(gap.top, 'pct')}`,
    delta: delta(share, before.value),
  };
}

/** Change in points, one decimal: '−1,4 pt', '+10,7 pts'. */
export function delta(now: number | null, before: number | null): KpiDelta | null {
  if (now === null || before === null) {
    return null;
  }
  const diff = now - before;
  if (Math.abs(diff) < FLAT_POINTS) {
    return { text: formatPoints(diff), tone: 'flat', direction: 'flat' };
  }
  return {
    text: formatPoints(diff),
    tone: diff > 0 ? 'good' : 'bad',
    direction: diff > 0 ? 'up' : 'down',
  };
}

function formatPoints(diff: number): string {
  const points = Math.round(Math.abs(diff) * 1000) / 10;
  const sign = diff > 0 && points ? '+' : diff < 0 && points ? '−' : '';
  const number = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(points);
  return `${sign}${number} ${points >= 2 ? 'pts' : 'pt'}`;
}

/** X axis of the month charts: month name and matches; hollow under 3 matches. */
export function monthTicks(months: readonly MonthPoint[]): MonthTick[] {
  return months.map((m) => ({
    key: m.month,
    label: m.label,
    sample: `${m.matches} ${m.matches > 1 ? 'matchs' : 'match'}`,
    faded: m.matches < MIN_MONTH_MATCHES,
  }));
}

/** The three lines of the headline chart, with their value over the period. */
export function trendSeries(view: SquadView): MonthSeries[] {
  const { rounds, firstDuels, pistols } = view.kpis;
  const values = (pick: (m: MonthPoint) => Rate) => view.months.map((m) => pick(m).value);
  const details = (pick: (m: MonthPoint) => Rate) =>
    view.months.map((m) => (pick(m).total ? rateWithVolume(pick(m).count, pick(m).total) : null));
  return [
    {
      key: 'rounds',
      label: 'Rounds gagnés',
      color: TREND_COLORS.rounds,
      values: values((m) => m.rounds),
      details: details((m) => m.rounds),
      total: formatValue(gapRate(rounds), 'pct'),
      area: true,
    },
    {
      key: 'first-duels',
      label: 'Premier duel',
      color: TREND_COLORS.firstDuels,
      values: values((m) => m.firstDuels),
      details: details((m) => m.firstDuels),
      total: formatValue(gapRate(firstDuels), 'pct'),
    },
    {
      key: 'pistols',
      label: 'Pistols',
      color: TREND_COLORS.pistols,
      values: values((m) => m.pistols),
      details: details((m) => m.pistols),
      total: formatValue(gapRate(pistols), 'pct'),
    },
  ];
}

/** Premier duel en défense month by month, the opening card's chart. */
export function defenseSeries(view: SquadView): MonthSeries[] {
  return [
    {
      key: 'duel-defense',
      label: 'Escouade',
      color: TREND_COLORS.rounds,
      values: view.months.map((m) => m.duelDefense.value),
      details: view.months.map((m) =>
        m.duelDefense.total ? rateWithVolume(m.duelDefense.count, m.duelDefense.total) : null,
      ),
      total: '',
      area: true,
    },
  ];
}
