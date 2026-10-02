import { Noun, Rate } from '@core/common/common.model';

/** Below this many tries a line is shown without colour: it would mostly be noise. */
export const GAP_MIN_TRIES = 5;

/** Default unit of a gap. */
export const ROUND_NOUN: Noun = { one: 'round', many: 'rounds' };

/** An even split, the reference of a duel or a first blood: as many as the opponents. */
export const EVEN_RATE: Rate = { count: 1, total: 2, value: 0.5 };

/** Note under an even reference. */
export const EVEN_NOTE = 'adversaire';
