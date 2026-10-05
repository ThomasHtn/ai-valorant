import { formatValue } from '@core/format/value-format.utils';
import { longDay, shortDay } from '@core/format/format.utils';
import { signedRounds } from '@core/report/gap.utils';
import { EveningMatches, MatchSummary } from '@core/report/matches.model';
import { RoundLine } from '@core/report/rounds.model';
import { CellTone } from '@core/report/tone.model';
import { RATE_AVERAGE_BAND } from '@core/report/tone.constants';
import { KpiItem } from '@shared/kpi-band/kpi-band.model';

import { matchLength, startTime } from '../matches/matches.utils';
import { SessionMatchRow, SessionRow } from './sessions.model';

/** Under this many rounds a session figure stays grey (the tables' team minimum). */
const MIN_ROUNDS = 20;
/** Pistols are two per match: their own minimum, as in the tables. */
const MIN_PISTOLS = 6;

const pct = (value: number | null) => formatValue(value, 'pct');

/** Rounds won over rounds, null without rounds. */
export function winRate(rounds: readonly RoundLine[]): number | null {
  return rounds.length ? rounds.filter((r) => r.won).length / rounds.length : null;
}

/** Sessions of the period, newest first, each against the whole period. */
export function sessionRows(
  evenings: readonly EveningMatches[],
  rounds: readonly RoundLine[],
  pool: ReadonlySet<string>,
): SessionRow[] {
  const monthRate = winRate(rounds);
  return evenings.map((evening) => {
    const own = rounds.filter((r) => r.day === evening.day);
    const rate = winRate(own);
    const first = evening.matches.reduce(
      (acc, m) => ({ won: acc.won + m.openingWon, all: acc.all + m.openingWon + m.openingLost }),
      { won: 0, all: 0 },
    );
    const firstRate = first.all ? first.won / first.all : null;
    const gap = rate === null || monthRate === null ? null : (rate - monthRate) * own.length;
    return {
      day: evening.day,
      label: capitalize(shortDay(evening.day)),
      span: timeSpan(evening.matches),
      maps: evening.matches.map((m) => ({
        key: m.matchId,
        map: m.mapName,
        won: m.won,
        score: `${m.roundsWon}-${m.roundsLost}`,
        offPool: pool.size > 0 && !pool.has(m.mapName),
      })),
      record: `${evening.wins}-${evening.losses}`,
      winning: evening.wins >= evening.losses,
      rounds: { rate, text: pct(rate), tone: rateTone(rate, 0.5, own.length) },
      firstDuels: { text: pct(firstRate), tone: rateTone(firstRate, 0.5, first.all) },
      turning: own.filter((r) => r.thrown).length,
      best: bestPlayer(evening.matches),
      gap: signedRounds(gap === null ? null : Math.round(gap)),
      gapTone:
        gap === null || own.length < MIN_ROUNDS
          ? 'small'
          : gap >= 1
            ? 'good'
            : gap <= -1
              ? 'bad'
              : 'avg',
    };
  });
}

/** Headline band of a session, each figure against the rest of its month. */
export function sessionKpis(
  session: readonly RoundLine[],
  month: readonly RoundLine[],
  matches: readonly MatchSummary[],
  monthName: string,
): KpiItem[] {
  const days = new Set(session.map((r) => r.matchId));
  const rest = month.filter((r) => !days.has(r.matchId));
  const share = (keep: (r: RoundLine) => boolean) => {
    const own = session.filter(keep);
    const ref = winRate(rest.filter(keep));
    const rate = winRate(own);
    return { own, ref, rate };
  };
  const item = (
    key: string,
    label: string,
    keep: (r: RoundLine) => boolean,
    min = MIN_ROUNDS,
  ): KpiItem => {
    const { own, ref, rate } = share(keep);
    return {
      key,
      label,
      value: rate === null ? '–' : String(Math.round(rate * 100)),
      unit: '%',
      tone: rateTone(rate, ref, own.length, min),
      fraction: rate,
      mark: ref,
      sub: `${own.filter((r) => r.won).length} sur ${own.length}, ${monthName} ${pct(ref)}`,
    };
  };
  const first = matches.reduce((n, m) => n + m.openingWon, 0);
  const duels = matches.reduce((n, m) => n + m.openingWon + m.openingLost, 0);
  const lost = session.filter((r) => !r.won).length;
  return [
    item('rounds', 'Rounds gagnés', () => true),
    item('att', 'Attaque', (r) => r.side === 'att'),
    item('def', 'Défense', (r) => r.side === 'def'),
    item('pistols', 'Pistols', (r) => r.buy === 'pistol', MIN_PISTOLS),
    {
      key: 'first-duels',
      label: 'Premier duel',
      help: 'firstDuels',
      value: duels ? String(Math.round((first / duels) * 100)) : '–',
      unit: '%',
      tone: rateTone(duels ? first / duels : null, 0.5, duels),
      fraction: duels ? first / duels : null,
      mark: 0.5,
      sub: `${first} gagnés sur ${duels}`,
    },
    {
      key: 'turning',
      label: 'Rounds basculés',
      help: 'turningRounds',
      value: String(session.filter((r) => r.thrown).length),
      tone: null,
      sub: `sur ${lost} rounds perdus`,
    },
  ];
}

/** Matches of a session in the order played. */
export function sessionMatchRows(
  matches: readonly MatchSummary[],
  rounds: readonly RoundLine[],
  pool: ReadonlySet<string>,
): SessionMatchRow[] {
  return matches.map((m) => {
    const total = m.roundsWon + m.roundsLost;
    const rate = total ? m.roundsWon / total : 0;
    const best = [...m.lineup].sort((a, b) => b.acs - a.acs)[0];
    return {
      matchId: m.matchId,
      map: m.mapName,
      score: `${m.roundsWon}-${m.roundsLost}`,
      won: m.won,
      rate,
      rateText: pct(rate),
      when: m.lengthMs
        ? `${startTime(m.startedAt)}, ${matchLength(m.lengthMs)}`
        : startTime(m.startedAt),
      best: best ? { name: best.name, agent: best.agent, acs: Math.round(best.acs) } : null,
      turning: rounds.filter((r) => r.matchId === m.matchId && r.thrown).length,
      offPool: pool.size > 0 && !pool.has(m.mapName),
    };
  });
}

/** The session in one sentence: against its month, the rounds that tipped, the best player. */
export function sessionLead(
  session: readonly RoundLine[],
  month: readonly RoundLine[],
  matches: readonly MatchSummary[],
  monthName: string,
): { lead: string; rest: string } | null {
  const rate = winRate(session);
  const days = new Set(session.map((r) => r.matchId));
  const ref = winRate(month.filter((r) => !days.has(r.matchId)));
  if (rate === null || ref === null) {
    return null;
  }
  const points = Math.round((rate - ref) * 100);
  const lead = `Session ${points >= 0 ? 'au-dessus' : 'en dessous'} du reste de ${monthName} : ${signedRounds(points)} points de rounds gagnés.`;
  const thrown = session.filter((r) => r.thrown);
  const parts: string[] = [];
  if (thrown.length) {
    const byMap = new Map<string, number>();
    thrown.forEach((r) => byMap.set(r.mapName, (byMap.get(r.mapName) ?? 0) + 1));
    const [map, count] = [...byMap].sort((a, b) => b[1] - a[1])[0];
    parts.push(
      `${thrown.length} ${thrown.length > 1 ? 'rounds ont basculé' : 'round a basculé'}${byMap.size > 1 ? `, dont ${count} sur ${map}` : ` sur ${map}`}.`,
    );
  }
  const best = bestPlayer(matches);
  if (best) {
    parts.push(`Meilleur ACS : ${best.name} (${best.acs}).`);
  }
  return { lead, rest: parts.join(' ') };
}

/** 'Samedi 27 septembre'. */
export function sessionTitle(day: string): string {
  return longDay(day);
}

function bestPlayer(
  matches: readonly MatchSummary[],
): { name: string; agent: string; acs: number } | null {
  const totals = new Map<string, { acs: number; n: number; agents: Map<string, number> }>();
  for (const line of matches.flatMap((m) => m.lineup)) {
    const t = totals.get(line.name) ?? { acs: 0, n: 0, agents: new Map() };
    t.acs += line.acs;
    t.n += 1;
    t.agents.set(line.agent, (t.agents.get(line.agent) ?? 0) + 1);
    totals.set(line.name, t);
  }
  const [name, t] = [...totals].sort((a, b) => b[1].acs / b[1].n - a[1].acs / a[1].n)[0] ?? [];
  if (!name || !t) {
    return null;
  }
  const agent = [...t.agents].sort((a, b) => b[1] - a[1])[0][0];
  return { name, agent, acs: Math.round(t.acs / t.n) };
}

/** '21h10 à 0h45', in the time the matches were written in. */
function timeSpan(matches: readonly MatchSummary[]): string {
  if (!matches.length) {
    return '';
  }
  const last = matches[matches.length - 1];
  const [hours, minutes] = last.startedAt.slice(11, 16).split(':').map(Number);
  const end = (hours * 60 + minutes + Math.round((last.lengthMs ?? 0) / 60000)) % (24 * 60);
  const endText = `${Math.floor(end / 60)}h${String(end % 60).padStart(2, '0')}`;
  return `${startTime(matches[0].startedAt)} à ${endText}`;
}

/** Orange within 3 points of the reference, grey under 20 rounds. */
function rateTone(
  rate: number | null,
  reference: number | null,
  sample: number,
  min = MIN_ROUNDS,
): CellTone {
  if (rate === null || reference === null || sample < min) {
    return 'small';
  }
  const gap = rate - reference;
  return Math.abs(gap) < RATE_AVERAGE_BAND ? 'avg' : gap > 0 ? 'good' : 'bad';
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
