import { agentRole } from '@core/game-assets/game-assets.utils';
import { ROLE_LABELS } from '@core/game-assets/game-assets.constants';
import { formatValue } from '@core/format/value-format.utils';
import { signedRounds } from '@core/report/gap.utils';
import { Rate } from '@core/report/rate.model';
import { CompLine, ContactZone, Habit, SiteShare, StrategyView } from '@core/report/strategy.model';
import { CellTone } from '@core/report/tone.model';
import { RATE_AVERAGE_BAND } from '@core/report/tone.constants';
import {
  MinimapDensitySpot,
  MinimapLabel,
  MinimapMarker,
} from '@shared/minimap-canvas/minimap-canvas.model';

import {
  AGENTS_PER_ROLE,
  EVEN_COST,
  MIN_HABIT_SAMPLE,
  MIN_SHARE_SAMPLE,
  ROLE_ORDER,
  SHARE_GAP,
  SITE_CALLOUT,
} from './strategy.constants';
import { CompRow, HabitRow, RolePicks, ShareRow } from './strategy.model';

const pct = (value: number | null) => formatValue(value, 'pct');

/** The top ranked's most played compos, then the squad's; agents absent from compo n° 1 are marked. */
export function compRows(view: StrategyView): CompRow[] {
  const best = new Set(view.comps[0]?.agents ?? []);
  const row = (comp: CompLine, rank: string, mine: boolean): CompRow => ({
    key: `${rank}-${comp.agents.join('-')}`,
    rank,
    agents: byRole(comp.agents).map((name) => ({
      name,
      role: agentRole(name) ?? '',
      differs: mine && best.size > 0 && !best.has(name),
    })),
    share: comp.share,
    shareText: pct(comp.share),
    rounds: pct(comp.rounds.value),
    matches: comp.matches,
    mine,
  });
  const rows = view.comps.map((c, i) => row(c, String(i + 1), false));
  return view.squadComp ? [...rows, row(view.squadComp, 'Vous', true)] : rows;
}

/**
 * Swaps that turn the squad's compo into the top ranked's n° 1: each agent of ours that is not in it,
 * paired with a missing one of the same role first, each missing agent used once.
 */
export function compSwaps(view: StrategyView): string[] {
  const best = view.comps[0]?.agents ?? [];
  const ours = view.squadComp?.agents ?? [];
  const extra = ours.filter((a) => !best.includes(a));
  const missing = best.filter((a) => !ours.includes(a));
  const take = (match: (agent: string) => boolean): string | null => {
    const index = missing.findIndex(match);
    return index < 0 ? null : missing.splice(index, 1)[0];
  };
  const paired = extra.map((a) => [a, take((m) => agentRole(m) === agentRole(a))] as const);
  return paired.map(([a, m]) => `${a} par ${m ?? take(() => true) ?? '?'}`);
}

/** Agents of the top ranked by role, the most played first; the squad's agents flagged. */
export function rolePicks(view: StrategyView): RolePicks[] {
  return ROLE_ORDER.map((role) => ({
    role,
    label: ROLE_LABELS[role],
    agents: view.agents
      .filter((a) => a.role === role)
      .slice(0, AGENTS_PER_ROLE)
      .map((a) => ({ name: a.agent, share: a.share, shareText: pct(a.share), squad: a.squad })),
  }));
}

/** Habits, the costliest first (the API's order); each with what it is worth for the top ranked. */
export function habitRows(habits: readonly Habit[]): HabitRow[] {
  return habits.map((h) => {
    const thin = h.squad.total < MIN_HABIT_SAMPLE || h.cost === null;
    return {
      key: h.key,
      label: h.label,
      effect:
        h.wonIf === null || h.wonElse === null
          ? h.detail
          : `Top ranked : ${pct(h.wonIf)} de rounds gagnés avec, ${pct(h.wonElse)} sans.`,
      top: pct(h.top.value),
      squad: h.squad.total ? `${pct(h.squad.value)}` : '–',
      topShare: h.top.value,
      squadShare: h.squad.value,
      tone: thin ? 'small' : costTone(h.cost),
      cost: signedRounds(h.cost),
      thin,
    };
  });
}

/** Plant sites: share of the plants and post-plant rounds won, top ranked beside the squad. */
export function siteRows(sites: readonly SiteShare[]): ShareRow[] {
  return sites.map((s) => shareRow(s.site, `Site ${s.site}`, s.top, s.squad, s.topWon, s.squadWon));
}

/** Defensive contact zones: share of opening duels there and duels won by the defense. */
export function contactRows(zones: readonly ContactZone[]): ShareRow[] {
  return zones.map((z) => shareRow(z.zone, z.zone, z.top, z.squad, z.topWon, z.squadWon));
}

/** The page's answer: the compo to aim for, and the habit that costs the most. */
export function strategyLead(
  view: StrategyView,
  habits: readonly HabitRow[],
): { lead: string; rest: string } | null {
  const best = view.comps[0];
  if (!best) {
    return null;
  }
  const lead = `Sur ${view.mapName}, la compo la plus jouée du top ranked est ${best.agents.join(', ')}.`;
  const parts: string[] = [];
  const swaps = compSwaps(view);
  if (view.squadComp) {
    parts.push(
      swaps.length
        ? `Par rapport à votre compo : ${swaps.join(', ')}.`
        : 'Votre compo est la plus jouée du top ranked.',
    );
  }
  const worst = habits.find((h) => !h.thin && h.tone === 'bad');
  if (worst) {
    parts.push(
      `L'habitude qui vous coûte le plus : ${worst.label.toLowerCase()} (${worst.squad} contre ${worst.top}, environ ${worst.cost} round par match).`,
    );
  }
  return { lead, rest: parts.join(' ') };
}

/** Top ranked plants as soft spots, the busiest cell weighing 1. */
export function plantDensity(view: StrategyView, color: string): MinimapDensitySpot[] {
  const max = Math.max(1, ...view.topPlants.map((c) => c.count));
  return view.topPlants.map((c, i) => ({
    id: `top-${i}`,
    x: c.x,
    y: c.y,
    weight: c.count / max,
    color,
  }));
}

/** Squad plants as dots: green when the round was won. */
export function plantMarkers(view: StrategyView): MinimapMarker[] {
  return view.squadPlants.map((p, i) => ({
    id: `plant-${i}`,
    x: p.x,
    y: p.y,
    shape: 'dot',
    color: p.won ? 'var(--color-rating-good)' : 'var(--color-rating-bad)',
  }));
}

/** Site names drawn on the plant minimaps. */
export function siteLabels(view: StrategyView): MinimapLabel[] {
  return view.callouts.filter((c) => SITE_CALLOUT.test(c.name));
}

/** Pool map to open: the asked one, else the squad's first map, else the pool's first. */
export function pickStrategyMap(
  param: string | undefined,
  pool: readonly string[],
  played: readonly string[],
): string | null {
  const find = (name: string | undefined) =>
    name ? pool.find((m) => m.toLowerCase() === name.toLowerCase()) : undefined;
  return find(param) ?? played.find((m) => pool.includes(m)) ?? pool[0] ?? null;
}

/** Agents in the order a team is read: duelists, controllers, initiators, sentinels. */
function byRole(agents: readonly string[]): string[] {
  const rank = (a: string) => ROLE_ORDER.indexOf(agentRole(a) ?? 'Sentinel');
  return [...agents].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

function shareRow(
  key: string,
  label: string,
  top: Rate,
  squad: Rate,
  topWon: Rate,
  squadWon: Rate,
): ShareRow {
  const squadThin = squad.total < MIN_SHARE_SAMPLE;
  const wonThin = squadWon.total < MIN_SHARE_SAMPLE;
  return {
    key,
    label,
    top: top.value,
    topText: pct(top.value),
    squad: squad.value,
    squadText: squad.total ? pct(squad.value) : '–',
    squadTone: squadThin
      ? 'small'
      : Math.abs((squad.value ?? 0) - (top.value ?? 0)) > SHARE_GAP
        ? 'bad'
        : 'avg',
    topWon: pct(topWon.value),
    squadWon: squadWon.total ? `${pct(squadWon.value)}` : '–',
    squadWonTone: wonThin ? 'small' : rateTone(squadWon.value, topWon.value),
    squadCount: squadWon.total,
  };
}

function rateTone(value: number | null, reference: number | null): CellTone {
  if (value === null || reference === null) {
    return 'small';
  }
  const gap = value - reference;
  return Math.abs(gap) < RATE_AVERAGE_BAND ? 'avg' : gap > 0 ? 'good' : 'bad';
}

function costTone(cost: number | null): CellTone {
  if (cost === null) {
    return 'small';
  }
  return Math.abs(cost) < EVEN_COST ? 'avg' : cost > 0 ? 'good' : 'bad';
}
