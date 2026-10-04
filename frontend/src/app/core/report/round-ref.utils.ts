import { RoundRef } from './rounds.model';

/** Separator between the match id and the round number in a round address ('<matchId>_<n>'). */
const SEPARATOR = '_';

/** Former route parameter of a round sheet ('<matchId>_<roundNumber>'), still read by old links. */
export function roundParam(ref: RoundRef): string {
  return `${ref.matchId}${SEPARATOR}${ref.roundNumber}`;
}

/** Reads '<matchId>_<roundNumber>'; null for anything else. Match ids contain dashes, never '_'. */
export function parseRoundParam(param: string | null | undefined): RoundRef | null {
  if (!param) {
    return null;
  }
  const at = param.lastIndexOf(SEPARATOR);
  const roundNumber = Number(param.slice(at + 1));
  if (at <= 0 || !Number.isInteger(roundNumber) || roundNumber < 1) {
    return null;
  }
  return { matchId: param.slice(0, at), roundNumber };
}

/** Router commands of a round's page, under its match. */
export function roundLink(ref: RoundRef): string[] {
  return ['/report/matches', ref.matchId, 'rounds', String(ref.roundNumber)];
}

export function sameRound(a: RoundRef | null, b: RoundRef | null): boolean {
  return !!a && !!b && a.matchId === b.matchId && a.roundNumber === b.roundNumber;
}
