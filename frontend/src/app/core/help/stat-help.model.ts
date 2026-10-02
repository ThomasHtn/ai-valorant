/** A change in the chance of winning the round, drawn as a small gauge (values from 0 to 1). */
export interface WinChanceSwing {
  from: number;
  to: number;
}

export interface HelpExample {
  text: string;
  swing?: WinChanceSwing;
}

/**
 * Plain-language explanation of a statistic, written for players who know the game but not
 * statistics. Only `title` and `what` are required.
 */
export interface StatHelp {
  title: string;
  /** What the number means, in one or two sentences. */
  what: string;
  /** How it is counted. */
  how?: string;
  example?: HelpExample;
  /** What a usual, good or bad value looks like. */
  read?: string;
}
