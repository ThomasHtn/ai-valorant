import { BuyType, Side } from '@core/common/enums.model';

/** Columns of the buy matrix, from the cheapest round to the full buy. */
export const MATRIX_BUYS: readonly BuyType[] = ['pistol', 'eco', 'force', 'full'];
/** Column names of the matrix. */
export const MATRIX_BUY_LABELS: Readonly<Record<BuyType, string>> = {
  pistol: 'Pistol',
  eco: 'Eco',
  force: 'Force buy',
  full: 'Full buy',
};
export const MATRIX_SIDES: readonly Side[] = ['att', 'def'];
/** Gap with the same cell over every map, in points, that colours a cell. */
export const MATRIX_GAP_POINTS = 8;
/** Under this many rounds a cell stays grey: one round more or less swings it too much. */
export const MATRIX_MIN_ROUNDS = 5;
/** Lost rounds in a row, inside one match, that make a losing streak. */
export const STREAK_MIN_ROUNDS = 4;
/** First round of each half: the pistols. */
export const PISTOL_ROUNDS: readonly number[] = [1, 13];
