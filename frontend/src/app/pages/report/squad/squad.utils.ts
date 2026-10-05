import { formatValue } from '@core/format/value-format.utils';
import {
  addRounds,
  byCost,
  gapRate,
  gapTone,
  isThin,
  mapVerdict,
  perMatch,
  signedRounds,
  volume,
} from '@core/report/gap.utils';
import { MapReference } from '@core/report/report-meta.model';
import { Gap, MapLine, Situation, SiteLine, SquadView } from '@core/report/squad.model';
import { KpiItem } from '@shared/kpi-band/kpi-band.model';

import { LEAD_PRIORITIES, LEAD_STRENGTHS } from './squad.constants';
import { GapCells, GapRow, MapRow, VerdictKey } from './squad.model';

/** A gap ready to draw; `matches` turns the rounds into a per-match figure. */
export function gapCells(gap: Gap, matches = 0): GapCells {
  const rate = gapRate(gap);
  const per = perMatch(gap.rounds, matches);
  return {
    rate,
    rateText: formatValue(rate, 'pct'),
    top: gap.top,
    tone: gapTone(gap),
    volume: volume(gap),
    rounds: signedRounds(gap.rounds),
    perMatch: per === null || !matches ? null : `${signedRounds(per)} par match`,
    thin: isThin(gap),
  };
}

export function situationRow(s: Situation): GapRow {
  return { key: s.key, label: s.label, sub: s.detail, map: null, gap: s.gap, maps: s.maps };
}

export function siteRow(s: SiteLine): GapRow {
  return {
    key: `${s.mapName}-${s.site}`,
    label: `${s.mapName} ${s.site}`,
    sub: null,
    map: s.mapName,
    gap: s.gap,
    maps: [],
  };
}

/** Situations costing rounds, the costliest first, thin ones last. */
export function priorities(situations: readonly Situation[]): GapRow[] {
  return byCost(
    situations.filter((s) => (s.gap.rounds ?? 0) < 0),
    (s) => s.gap,
  ).map(situationRow);
}

/** Situations winning rounds, the best first, thin ones last. */
export function strengths(situations: readonly Situation[]): GapRow[] {
  return situations
    .filter((s) => (s.gap.rounds ?? 0) > 0)
    .sort(
      (a, b) =>
        Number(isThin(a.gap)) - Number(isThin(b.gap)) || (b.gap.rounds ?? 0) - (a.gap.rounds ?? 0),
    )
    .map(situationRow);
}

/** Maps by rounds lost against the top ranked, the costliest first; thin and collecting maps last. */
export function mapRows(maps: readonly MapLine[], references: readonly MapReference[]): MapRow[] {
  const collecting = new Set(references.filter((r) => r.collecting).map((r) => r.mapName));
  return maps
    .map((m) => {
      const rounds = addRounds(m.attack.rounds, m.defense.rounds);
      const verdict: VerdictKey = collecting.has(m.mapName)
        ? 'collecting'
        : mapVerdict(rounds, m.matches);
      const total: Gap = {
        k: m.attack.k + m.defense.k,
        n: m.attack.n + m.defense.n,
        top: m.attack.n + m.defense.n ? 0.5 : null,
        topN: m.attack.topN,
        rounds,
      };
      return {
        map: m.mapName,
        matches: m.matches,
        record: `${m.wins} V ${m.matches - m.wins} D`,
        attack: gapCells(m.attack),
        defense: gapCells(m.defense),
        rounds: signedRounds(rounds),
        roundsTone: verdict === 'test' || verdict === 'collecting' ? 'small' : gapTone(total),
        verdict,
        thin: verdict === 'test' || verdict === 'collecting',
        order: rounds ?? 0,
      };
    })
    .sort((a, b) => Number(a.thin) - Number(b.thin) || a.order - b.order)
    .map(({ order: _order, ...row }) => row);
}

/** Headline band: outcomes only, the situations behind them are in the boards below. */
export function kpiItems(view: SquadView): KpiItem[] {
  const { wins, rounds, firstDuels, pistols, turning, lost } = view.kpis;
  const winGap: Gap = {
    k: wins.count,
    n: wins.total,
    top: 0.5,
    topN: 0,
    rounds: wins.count - wins.total / 2,
  };
  return [
    {
      key: 'wins',
      label: 'Victoires',
      value: percent(wins.value),
      unit: '%',
      tone: gapTone(winGap),
      fraction: wins.value,
      mark: 0.5,
      sub: `${wins.count} V, ${wins.total - wins.count} D sur ${wins.total} matchs`,
    },
    {
      key: 'rounds',
      label: 'Rounds gagnés',
      value: percent(gapRate(rounds)),
      unit: '%',
      tone: gapTone(rounds),
      fraction: gapRate(rounds),
      mark: rounds.top,
      sub: `${rounds.k} gagnés, ${rounds.n - rounds.k} perdus`,
    },
    {
      key: 'first-duels',
      label: 'Premier duel',
      help: 'firstDuels',
      value: percent(gapRate(firstDuels)),
      unit: '%',
      tone: gapTone(firstDuels),
      fraction: gapRate(firstDuels),
      mark: firstDuels.top,
      sub: `${firstDuels.k} sur ${firstDuels.n}, top ranked ${formatValue(firstDuels.top, 'pct')}`,
    },
    {
      key: 'pistols',
      label: 'Pistols',
      value: percent(gapRate(pistols)),
      unit: '%',
      tone: gapTone(pistols),
      fraction: gapRate(pistols),
      mark: pistols.top,
      sub: `${pistols.k} sur ${pistols.n}, top ranked ${formatValue(pistols.top, 'pct')}`,
    },
    {
      key: 'turning',
      label: 'Rounds basculés',
      help: 'turningRounds',
      value: String(turning),
      tone: null,
      sub: `sur ${lost} rounds perdus`,
    },
  ];
}

/**
 * The page's answer in one sentence: the costliest situations, the map where the gaps gather, and
 * what already works. Null when nothing stands out yet.
 */
export function conclusion(
  view: SquadView,
  maps: readonly MapRow[],
): { lead: string; rest: string } | null {
  const costly = priorities(view.situations)
    .filter((r) => !isThin(r.gap))
    .slice(0, LEAD_PRIORITIES);
  if (!costly.length) {
    return null;
  }
  const lead = `L'escouade perd surtout des rounds sur : ${costly
    .map((r) => `${r.label.toLowerCase()} (${signedRounds(r.gap.rounds)})`)
    .join(', ')}.`;
  const parts: string[] = [];
  const worst = maps.find((m) => !m.thin && m.verdict === 'work');
  if (worst) {
    parts.push(`${worst.map} concentre les écarts (${worst.rounds} rounds).`);
  }
  const good = strengths(view.situations)
    .filter((r) => !isThin(r.gap))
    .slice(0, LEAD_STRENGTHS);
  if (good.length) {
    parts.push(
      `${capitalize(good.map((r) => r.label.toLowerCase()).join(' et '))} ${good.length > 1 ? 'rapportent' : 'rapporte'} plus que chez le top ranked.`,
    );
  }
  return { lead, rest: parts.join(' ') };
}

function percent(value: number | null): string {
  return value === null ? '–' : String(Math.round(value * 100));
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
