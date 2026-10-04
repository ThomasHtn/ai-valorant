import { BuyType, Side } from '@core/common/enums.model';
import { SIDE_LABELS } from '@core/format/labels.constants';
import { RoundLine } from '@core/report/rounds.model';

import {
  MATRIX_BUY_LABELS,
  MATRIX_BUYS,
  MATRIX_GAP_POINTS,
  MATRIX_MIN_ROUNDS,
  MATRIX_SIDES,
  PISTOL_ROUNDS,
  STREAK_MIN_ROUNDS,
} from './rounds-overview.constants';
import { CostlyMoment, MatrixCell, MatrixRow, MomentKind } from './rounds-overview.model';
import { HoverTipContent } from '@shared/hover-tip/hover-tip.model';

/** Key of a round, unique over the period. */
export function roundKey(round: Pick<RoundLine, 'matchId' | 'roundNumber'>): string {
  return `${round.matchId}_${round.roundNumber}`;
}

function cell(
  rounds: readonly RoundLine[],
  buy: BuyType | null,
  reference: number | null,
): MatrixCell {
  const kept = buy ? rounds.filter((r) => r.buy === buy) : rounds;
  const won = kept.filter((r) => r.won).length;
  const played = kept.length;
  let tone: MatrixCell['tone'] = 'neutral';
  if (played < MATRIX_MIN_ROUNDS) {
    tone = 'small';
  } else if (reference !== null) {
    const gap = (won / played - reference) * 100;
    tone = gap >= MATRIX_GAP_POINTS ? 'good' : gap <= -MATRIX_GAP_POINTS ? 'bad' : 'neutral';
  }
  return { buy: buy ?? 'full', won, played, tone };
}

function rate(rounds: readonly RoundLine[]): number | null {
  return rounds.length ? rounds.filter((r) => r.won).length / rounds.length : null;
}

/**
 * Rounds won by map, side and buy. Each cell is coloured against the same side and buy over every
 * map, so a red cell is a map problem rather than the buy's natural rate (an eco is rarely won).
 */
/** '1 sur 3': rounds won out of rounds played in a matrix cell. */
export function wonRecord(cell: MatrixCell): string {
  return `${cell.won} sur ${cell.played}`;
}

/** Tip of a matrix cell: 'Split, défense, full buy', then '18 rounds gagnés sur 37 joués.' */
export function matrixCellTip(row: MatrixRow, cell: MatrixCell, withBuy: boolean): HoverTipContent {
  const where = [row.map || 'Toutes les cartes', SIDE_LABELS[row.side].toLowerCase()];
  if (withBuy) {
    where.push(MATRIX_BUY_LABELS[cell.buy].toLowerCase());
  }
  return {
    title: where.join(', '),
    text: `${cell.won} rounds gagnés sur ${cell.played} joués.`,
    note: 'Clic : ses rounds perdus.',
  };
}

export function buyMatrix(rounds: readonly RoundLine[]): MatrixRow[] {
  const maps = [...new Set(rounds.map((r) => r.mapName))].sort();
  const row = (map: string, side: Side, compare: boolean): MatrixRow => {
    const own = rounds.filter((r) => r.side === side && (!map || r.mapName === map));
    const all = rounds.filter((r) => r.side === side);
    return {
      map,
      side,
      cells: MATRIX_BUYS.map((buy) =>
        cell(own, buy, compare ? rate(all.filter((r) => r.buy === buy)) : null),
      ),
      total: cell(own, null, compare ? rate(all) : null),
    };
  };
  return [
    ...maps.flatMap((map) => MATRIX_SIDES.map((side) => row(map, side, true))),
    ...MATRIX_SIDES.map((side) => row('', side, false)),
  ];
}

/** Rounds of each match in play order. */
function byMatch(rounds: readonly RoundLine[]): RoundLine[][] {
  const groups = new Map<string, RoundLine[]>();
  for (const round of rounds) {
    groups.set(round.matchId, [...(groups.get(round.matchId) ?? []), round]);
  }
  return [...groups.values()].map((g) => [...g].sort((a, b) => a.roundNumber - b.roundNumber));
}

/** Keys of the rounds that belong to a moment, over whole matches of the given rounds. */
export function momentKeys(rounds: readonly RoundLine[], kind: MomentKind): Set<string> {
  const keys = new Set<string>();
  for (const match of byMatch(rounds)) {
    const at = new Map(match.map((r) => [r.roundNumber, r]));
    if (kind === 'streak') {
      let run: RoundLine[] = [];
      for (const round of [...match, null]) {
        if (round && !round.won) {
          run.push(round);
          continue;
        }
        if (run.length >= STREAK_MIN_ROUNDS) {
          run.forEach((r) => keys.add(roundKey(r)));
        }
        run = [];
      }
      continue;
    }
    for (const pistol of PISTOL_ROUNDS) {
      const first = at.get(pistol);
      const second = at.get(pistol + 1);
      const third = at.get(pistol + 2);
      if (kind === 'after_pistol_loss' && first && !first.won && second) {
        keys.add(roundKey(second));
      }
      if (kind === 'bonus' && first?.won && second?.won && third) {
        keys.add(roundKey(third));
      }
    }
  }
  return keys;
}

/** Number of losing streaks, for the moments block. */
function streakCount(rounds: readonly RoundLine[]): number {
  return byMatch(rounds).reduce((count, match) => {
    let run = 0;
    let streaks = 0;
    for (const round of [...match, null]) {
      if (round && !round.won) {
        run += 1;
      } else {
        streaks += run >= STREAK_MIN_ROUNDS ? 1 : 0;
        run = 0;
      }
    }
    return count + streaks;
  }, 0);
}

function wonOf(rounds: readonly RoundLine[]): string {
  return `${rounds.filter((r) => r.won).length} sur ${rounds.length}`;
}

/** The moments of the period that cost rounds, in the order a match runs into them. */
export function costlyMoments(rounds: readonly RoundLine[]): CostlyMoment[] {
  const lost = rounds.filter((r) => !r.won).length;
  const thrown = rounds.filter((r) => r.thrown).length;
  const pistols = rounds.filter((r) => PISTOL_ROUNDS.includes(r.roundNumber));
  const pick = (kind: MomentKind) => {
    const keys = momentKeys(rounds, kind);
    return rounds.filter((r) => keys.has(roundKey(r)));
  };
  const afterLoss = pick('after_pistol_loss');
  const bonus = pick('bonus');
  const streakRounds = pick('streak');
  const streaks = streakCount(rounds);
  return [
    {
      key: 'pistols',
      label: 'Pistol rounds gagnés',
      figure: wonOf(pistols),
      unit: 'pistols',
      detail: 'rounds 1 et 13 de chaque match',
      bad: false,
    },
    {
      key: 'after_pistol_loss',
      label: 'Round après un pistol perdu',
      figure: wonOf(afterLoss),
      unit: 'gagnés',
      detail: 'souvent en eco face à un full buy adverse',
      bad: false,
    },
    {
      key: 'bonus',
      label: 'Round bonus',
      figure: wonOf(bonus),
      unit: 'gagnés',
      detail: 'le round 3 ou 15, après pistol et round 2 gagnés',
      bad: false,
    },
    {
      key: 'streak',
      label: `Séries de ${STREAK_MIN_ROUNDS} rounds perdus d'affilée ou plus`,
      figure: String(streaks),
      unit: streaks > 1 ? 'séries' : 'série',
      detail: `${streakRounds.length} rounds perdus dans ces séries`,
      bad: streakRounds.length > 0,
    },
    {
      key: 'throws',
      label: 'Throws',
      figure: String(thrown),
      unit: thrown > 1 ? 'rounds' : 'round',
      detail: `perdus avec au moins 70 % de chances de gagner, sur ${lost} rounds perdus`,
      bad: thrown > 0,
    },
  ];
}
