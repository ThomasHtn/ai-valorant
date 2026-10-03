import { RoundLine } from '@core/report/rounds.model';

/** Whether a figure or fact speaks for the squad, against it, or neither. */
export type DigestTone = 'good' | 'bad' | null;

/** A key figure of a match card ('Attaque', '7-5'). */
export interface DigestFigure {
  label: string;
  value: string;
  tone: DigestTone;
}

/** A sentence telling what happened in the match ('Menait 9-4, perd 11-13'). */
export interface DigestFact {
  key: string;
  text: string;
  tone: 'good' | 'bad';
}

/** What a match card sums up before the match is opened. */
export interface MatchDigest {
  figures: DigestFigure[];
  facts: DigestFact[];
}

/** The fields of a round the digest reads. */
export type DigestRound = Pick<
  RoundLine,
  'roundNumber' | 'side' | 'won' | 'buy' | 'oppBuy' | 'cause' | 'thrown'
>;
