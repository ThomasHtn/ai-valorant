import { REFERENCE_LABELS } from '@core/format/labels.constants';
import { formatValue, integer } from '@core/format/value-format.utils';
import { gapRate, signedRounds } from '@core/report/gap.utils';
import { Gap } from '@core/report/squad.model';
import { StatCell, StatColumn } from '@core/report/stat-table.model';
import { HoverTipContent, HoverTipLine } from '@shared/hover-tip/hover-tip.model';

import { pointsText } from './dash.utils';

/** What a gap in rounds means, under every gap tip. */
export const ROUNDS_NOTE =
  "Rounds : gagnés en plus ou en moins qu'une équipe top ranked sur les mêmes rounds.";

/** '41 % (22 sur 52)'. */
export function rateWithVolume(k: number, n: number): string {
  return `${formatValue(n ? k / n : null, 'pct')} (${integer(k)} sur ${integer(n)})`;
}

/** Squad against top ranked on one situation: both rates with their samples, then the gap. */
export function gapTip(title: string, gap: Gap, text?: string): HoverTipContent {
  const lines: HoverTipLine[] = [{ label: "L'escouade", value: rateWithVolume(gap.k, gap.n) }];
  if (gap.top !== null) {
    lines.push({
      label: 'Top ranked',
      value: `${formatValue(gap.top, 'pct')} (sur ${integer(gap.topN)} rounds)`,
    });
    lines.push({ label: 'Écart', value: pointsText(gap) });
    lines.push({ label: 'Rounds', value: `${signedRounds(gap.rounds)} rounds` });
  }
  return { title, text, lines, note: ROUNDS_NOTE };
}

/** A map's record: matches, wins, rounds played and won. */
export function recordTip(map: string, matches: number, wins: number, gap: Gap): HoverTipContent {
  return {
    title: map,
    lines: [
      { label: 'Matchs', value: integer(matches) },
      { label: 'Victoires', value: rateWithVolume(wins, matches) },
      { label: 'Défaites', value: integer(matches - wins) },
      { label: 'Rounds gagnés', value: rateWithVolume(gap.k, gap.n) },
    ],
  };
}

/** A map's gap split by side. */
export function sidesTip(
  map: string,
  attack: Gap,
  defense: Gap,
  total: number | null,
): HoverTipContent {
  return {
    title: `${map}, rounds face au top ranked`,
    lines: [
      {
        label: 'Attaque',
        value: `${signedRounds(attack.rounds)} (${formatValue(gapRate(attack), 'pct')})`,
      },
      {
        label: 'Défense',
        value: `${signedRounds(defense.rounds)} (${formatValue(gapRate(defense), 'pct')})`,
      },
      { label: 'Carte entière', value: signedRounds(total) },
    ],
    note: 'Verdict : solide à partir de +2 rounds, à travailler à −5 ou moins, à tester sous 3 matchs.',
  };
}

/** A player's figure: his value, then the top ranked, his opponents and his history. */
export function rosterTip(
  player: string,
  cell: StatCell,
  column: StatColumn,
  unit: string,
): HoverTipContent {
  const sample = (n: number | null | undefined) =>
    n === null || n === undefined ? '' : ` (sur ${integer(n)} ${unit})`;
  const lines: HoverTipLine[] = [
    { label: player, value: `${formatValue(cell.v, column.format)}${sample(cell.n)}` },
  ];
  const references = [
    { label: REFERENCE_LABELS.top, value: cell.top, n: cell.topN },
    { label: REFERENCE_LABELS.opp, value: cell.opp, n: cell.oppN },
    { label: `${player} avant la période`, value: cell.hist, n: cell.histN },
  ];
  for (const ref of references) {
    if (ref.value !== null && ref.value !== undefined) {
      lines.push({
        label: ref.label,
        value: `${formatValue(ref.value, column.format)}${sample(ref.n)}`,
      });
    }
  }
  return { title: column.label, lines, note: 'Couleur : comparé au top ranked.' };
}
