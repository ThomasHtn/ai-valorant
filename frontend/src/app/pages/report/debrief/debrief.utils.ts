import { formatValue } from '@core/format/value-format.utils';
import { LOSS_CAUSE_LABELS } from '@core/format/labels.constants';
import { EMPTY, throwLabel } from '@core/format/format.utils';
import { EveningMatches } from '@core/report/matches.model';
import { RoundLine } from '@core/report/rounds.model';

import { RATE_AVERAGE_BAND } from '@core/report/tone.constants';

import {
  DEBRIEF_MIN_PISTOLS,
  DEBRIEF_MIN_ROUNDS,
  TURNING_MAX_ROUNDS,
  TURNING_MIN_CHANCE,
} from './debrief.constants';
import { DebriefTile, PlayerForm, TurningRound } from './debrief.model';

/** Rounds behind each tile, in display order. */
const TILE_RULES: readonly {
  key: string;
  label: string;
  min: number;
  keep: (r: RoundLine) => boolean;
}[] = [
  { key: 'rounds', label: 'Rounds gagnés', min: DEBRIEF_MIN_ROUNDS, keep: () => true },
  { key: 'att', label: 'Attaque', min: DEBRIEF_MIN_ROUNDS, keep: (r) => r.side === 'att' },
  { key: 'def', label: 'Défense', min: DEBRIEF_MIN_ROUNDS, keep: (r) => r.side === 'def' },
  { key: 'pistols', label: 'Pistols', min: DEBRIEF_MIN_PISTOLS, keep: (r) => r.buy === 'pistol' },
  {
    key: 'full',
    label: 'Full buy contre full buy',
    min: DEBRIEF_MIN_ROUNDS,
    keep: (r) => r.buy === 'full' && r.oppBuy === 'full',
  },
];

function share(rounds: readonly RoundLine[]): number | null {
  return rounds.length ? rounds.filter((r) => r.won).length / rounds.length : null;
}

/**
 * Session figures beside the rest of the month (the session left out, else it is compared with
 * itself); a tile is coloured like a table cell: orange within 3 points, grey under its minimum.
 */
export function debriefTiles(
  session: readonly RoundLine[],
  month: readonly RoundLine[],
  monthName: string,
): DebriefTile[] {
  const sessionMatches = new Set(session.map((r) => r.matchId));
  const rest = month.filter((r) => !sessionMatches.has(r.matchId));
  return TILE_RULES.map((rule) => {
    const own = session.filter(rule.keep);
    const value = share(own);
    const reference = share(rest.filter(rule.keep));
    let tone: DebriefTile['tone'] = null;
    if (value !== null && reference !== null) {
      const gap = value - reference;
      tone =
        own.length < rule.min
          ? 'small'
          : gap >= RATE_AVERAGE_BAND
            ? 'good'
            : gap <= -RATE_AVERAGE_BAND
              ? 'bad'
              : 'avg';
    }
    return {
      key: rule.key,
      label: rule.label,
      value: formatValue(value, 'pct'),
      tone,
      lines: [
        `${monthName} hors session : ${reference === null ? EMPTY : formatValue(reference, 'pct')}`,
        `Sur ${own.length} rounds`,
      ],
    };
  });
}

interface Totals {
  matches: number;
  acs: number;
  kills: number;
  deaths: number;
  agents: Map<string, number>;
}

function totals(evenings: readonly EveningMatches[]): Map<string, Totals> {
  const byName = new Map<string, Totals>();
  for (const match of evenings.flatMap((e) => e.matches)) {
    for (const line of match.lineup) {
      const t = byName.get(line.name) ?? {
        matches: 0,
        acs: 0,
        kills: 0,
        deaths: 0,
        agents: new Map(),
      };
      t.matches += 1;
      t.acs += line.acs;
      t.kills += line.kills;
      t.deaths += line.deaths;
      t.agents.set(line.agent, (t.agents.get(line.agent) ?? 0) + 1);
      byName.set(line.name, t);
    }
  }
  return byName;
}

const kd = (t: Totals) => (t.deaths ? t.kills / t.deaths : t.kills);

/** Players of the session, best ACS first, each against his own month without the session. */
export function playerForms(
  session: readonly EveningMatches[],
  month: readonly EveningMatches[],
): PlayerForm[] {
  const sessionMatches = new Set(session.flatMap((e) => e.matches.map((m) => m.matchId)));
  const monthly = totals(
    month.map((e) => ({ ...e, matches: e.matches.filter((m) => !sessionMatches.has(m.matchId)) })),
  );
  return [...totals(session)]
    .map(([name, t]) => {
      const m = monthly.get(name);
      const acs = t.acs / t.matches;
      return {
        name,
        agent: [...t.agents].sort((a, b) => b[1] - a[1])[0][0],
        matches: t.matches,
        acs,
        acsGap: m ? acs - m.acs / m.matches : null,
        kd: kd(t),
        kdGap: m ? kd(t) - kd(m) : null,
      };
    })
    .sort((a, b) => b.acs - a.acs);
}

/** Lost rounds the squad had in hand, the biggest chance first. */
export function turningRounds(session: readonly RoundLine[]): TurningRound[] {
  return session
    .filter((r) => !r.won && (r.bestProbability ?? 0) >= TURNING_MIN_CHANCE)
    .sort((a, b) => (b.bestProbability ?? 0) - (a.bestProbability ?? 0))
    .slice(0, TURNING_MAX_ROUNDS)
    .map((r) => ({
      key: `${r.matchId}_${r.roundNumber}`,
      matchId: r.matchId,
      roundNumber: r.roundNumber,
      mapName: r.mapName,
      cause: r.cause ? LOSS_CAUSE_LABELS[r.cause] : 'Perdu',
      chance: r.thrown
        ? throwLabel(r.bestProbability ?? 0)
        : `Avait ${Math.round((r.bestProbability ?? 0) * 100)} % de chances`,
    }));
}
