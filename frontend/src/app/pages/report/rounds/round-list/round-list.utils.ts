import { RoundLine } from '@core/report/rounds.model';

/** Right-hand figure of a list row, with a short visible prefix and a full title. */
export interface RoundFigure {
  figurePrefix: string;
  figure: string;
  figureTitle: string;
}

/** 'max 4v3' (best situation of the round) or 'chute −40 pts' (biggest fall of the squad's chance). */
export function roundFigure(round: RoundLine, showSwing: boolean): RoundFigure {
  if (showSwing) {
    const points = Math.round(round.maxDrop * 100);
    return {
      figurePrefix: 'chute',
      figure: points ? `−${points} pts` : '0 pt',
      figureTitle: "Plus forte chute des chances de l'escouade en une action",
    };
  }
  const chance =
    round.bestProbability === null
      ? ''
      : ` (${Math.round(round.bestProbability * 100)} % de chances)`;
  return {
    figurePrefix: 'max',
    figure: round.bestState ?? '—',
    figureTitle: `Meilleure situation du round${chance}`,
  };
}
