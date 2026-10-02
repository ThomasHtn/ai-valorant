import { percent } from '@core/format/format.utils';
import { SIDE_LABELS } from '@core/format/labels.constants';
import { Opening } from '@core/periods/team.model';
import { EVEN_NOTE, EVEN_RATE } from '@shared/gap-list/gap-list.constants';
import { GapLine } from '@shared/gap-list/gap-list.model';

const FIRST_BLOOD = { one: 'first blood', many: 'first bloods' };
const DUEL = { one: 'duel', many: 'duels' };

/** Per side: first bloods taken (even is 50 %), then rounds won after a first blood and a first death. */
export function openingSideLines(opening: Opening): GapLine[] {
  return opening.sides.flatMap((side) => {
    const where = `en ${SIDE_LABELS[side.side].toLowerCase()}`;
    return [
      {
        label: `First bloods pris ${where}`,
        squad: side.firstBlood,
        reference: EVEN_RATE,
        referenceNote: EVEN_NOTE,
        unit: FIRST_BLOOD,
      },
      {
        label: `Rounds gagnés après un first blood ${where}`,
        squad: side.convert.squad,
        reference: side.convert.reference,
      },
      {
        label: `Rounds gagnés après une first death ${where}`,
        squad: side.recover.squad,
        reference: side.recover.reference,
      },
    ];
  });
}

/** Each player's opening duels won, against an even split. */
export function playerDuelLines(opening: Opening): GapLine[] {
  return opening.players.map((p) => ({
    label: p.name,
    detail: `${p.firstBloods} first bloods, ${p.firstDeaths} first deaths`,
    squad: {
      count: p.firstBloods,
      total: p.firstBloods + p.firstDeaths,
      value: p.firstBloods + p.firstDeaths ? p.firstBloods / (p.firstBloods + p.firstDeaths) : null,
    },
    reference: EVEN_RATE,
    referenceNote: EVEN_NOTE,
    unit: DUEL,
  }));
}

/** Rounds the squad still wins after each player's first death, against the top ranked. */
export function playerRecoverLines(opening: Opening): GapLine[] {
  return opening.players.map((p) => ({
    label: p.name,
    detail: `${percent(p.firstDeathsTraded)} de ses first deaths vengées`,
    squad: p.wonAfterFirstDeath,
    reference: opening.topRecover,
  }));
}
