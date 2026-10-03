import { LossCause, Side } from '@core/common/enums.model';
import { LOSS_CAUSE_LABELS, SIDE_LABELS } from '@core/format/labels.constants';
import { MatchSummary } from '@core/report/matches.model';

import { scoreGaps } from '../matches.utils';
import {
  CAUSE_MIN,
  MAX_FACTS,
  STREAK_MIN,
  SWING_MIN_GAP,
  THROWN_MIN,
  UNDERDOG_MIN,
} from './match-digest.constants';
import {
  DigestFact,
  DigestFigure,
  DigestRound,
  DigestTone,
  MatchDigest,
} from './match-digest.model';

/** 'good' when the squad won more, 'bad' when it won less, null on a tie or nothing played. */
function balanceTone(won: number, lost: number): DigestTone {
  return won > lost ? 'good' : won < lost ? 'bad' : null;
}

/** Score of the squad after each round, from the gaps: wins minus losses and wins plus losses. */
function scoreAt(roundNumber: number, gap: number): string {
  const wins = (roundNumber + gap) / 2;
  return `${wins}-${roundNumber - wins}`;
}

/** Halves (start side first), pistols and opening duels: the figures every card shows. */
export function digestFigures(match: MatchSummary, rounds: readonly DigestRound[]): DigestFigure[] {
  const figures: DigestFigure[] = [];
  const start = rounds[0]?.side;
  if (start) {
    const sides: Side[] = start === 'att' ? ['att', 'def'] : ['def', 'att'];
    for (const side of sides) {
      const played = rounds.filter((r) => r.side === side);
      const won = played.filter((r) => r.won).length;
      figures.push({
        label: SIDE_LABELS[side],
        value: `${won}-${played.length - won}`,
        tone: balanceTone(won, played.length - won),
      });
    }
    const pistols = rounds.filter((r) => r.buy === 'pistol');
    const pistolsWon = pistols.filter((r) => r.won).length;
    figures.push({
      label: 'Pistols',
      value: `${pistolsWon} sur ${pistols.length}`,
      tone: balanceTone(pistolsWon, pistols.length - pistolsWon),
    });
  }
  figures.push({
    label: 'Premiers duels',
    value: `${match.openingWon}-${match.openingLost}`,
    tone: balanceTone(match.openingWon, match.openingLost),
  });
  return figures;
}

/** A won match the squad was well behind in, or a lost one it led well. */
function swingFact(match: MatchSummary, rounds: readonly DigestRound[]): DigestFact | null {
  const gaps = scoreGaps(rounds);
  const final = `${match.roundsWon}-${match.roundsLost}`;
  const pick = (target: number) => rounds[gaps.indexOf(target)].roundNumber;
  const lead = Math.max(0, ...gaps);
  const deficit = Math.min(0, ...gaps);
  if (!match.won && lead >= SWING_MIN_GAP) {
    return {
      key: 'swing',
      tone: 'bad',
      text: `Menait ${scoreAt(pick(lead), lead)}, perd ${final}`,
    };
  }
  if (match.won && -deficit >= SWING_MIN_GAP) {
    return {
      key: 'swing',
      tone: 'good',
      text: `Mené ${scoreAt(pick(deficit), deficit)}, gagne ${final}`,
    };
  }
  return null;
}

/** Longest run of rounds with the given result, as first and last round numbers. */
function longestStreak(
  rounds: readonly DigestRound[],
  won: boolean,
): { length: number; from: number; to: number } {
  let best = { length: 0, from: 0, to: 0 };
  let length = 0;
  rounds.forEach((round, index) => {
    length = round.won === won ? length + 1 : 0;
    if (length > best.length) {
      best = { length, from: rounds[index - length + 1].roundNumber, to: round.roundNumber };
    }
  });
  return best;
}

function streakFact(rounds: readonly DigestRound[], won: boolean): DigestFact | null {
  const streak = longestStreak(rounds, won);
  if (streak.length < STREAK_MIN) {
    return null;
  }
  return {
    key: won ? 'win-streak' : 'loss-streak',
    tone: won ? 'good' : 'bad',
    text: `${streak.length} rounds ${won ? 'gagnés' : 'perdus'} d'affilée (R${streak.from} à R${streak.to})`,
  };
}

function thrownFact(rounds: readonly DigestRound[]): DigestFact | null {
  const thrown = rounds.filter((r) => r.thrown).length;
  return thrown >= THROWN_MIN
    ? {
        key: 'thrown',
        tone: 'bad',
        text: `${thrown} rounds perdus après avoir eu 70 % de chances de les gagner`,
      }
    : null;
}

/** Rounds won on an eco or force buy against a full buy. */
function underdogFact(rounds: readonly DigestRound[]): DigestFact | null {
  const count = rounds.filter(
    (r) => r.won && (r.buy === 'eco' || r.buy === 'force') && r.oppBuy === 'full',
  ).length;
  return count >= UNDERDOG_MIN
    ? {
        key: 'underdog',
        tone: 'good',
        text: `${count} rounds gagnés en eco ou force buy contre un full buy`,
      }
    : null;
}

/** The cause behind most lost rounds, when it repeats enough to be a leak. */
function causeFact(rounds: readonly DigestRound[]): DigestFact | null {
  const lost = rounds.filter((r) => !r.won);
  const counts = new Map<LossCause, number>();
  for (const round of lost) {
    if (round.cause) {
      counts.set(round.cause, (counts.get(round.cause) ?? 0) + 1);
    }
  }
  const [cause, count] = [...counts].sort((a, b) => b[1] - a[1])[0] ?? [null, 0];
  if (!cause || count < CAUSE_MIN) {
    return null;
  }
  return {
    key: 'cause',
    tone: 'bad',
    text: `Cause n°1 des rounds perdus : ${LOSS_CAUSE_LABELS[cause].toLowerCase()} (${count} sur ${lost.length})`,
  };
}

/**
 * What a match card says before the match is opened: its key figures, then up to three facts, the
 * score swing first, then what decided the result.
 */
export function matchDigest(match: MatchSummary, rounds: readonly DigestRound[]): MatchDigest {
  const ordered = [...rounds].sort((a, b) => a.roundNumber - b.roundNumber);
  // A won match leads with what went right, a lost one with what went wrong.
  const good = [streakFact(ordered, true), underdogFact(ordered)];
  const bad = [streakFact(ordered, false), thrownFact(ordered), causeFact(ordered)];
  const candidates = ordered.length
    ? [swingFact(match, ordered), ...(match.won ? [...good, ...bad] : [...bad, ...good])]
    : [];
  return {
    figures: digestFigures(match, ordered),
    facts: candidates.filter((fact): fact is DigestFact => fact !== null).slice(0, MAX_FACTS),
  };
}
