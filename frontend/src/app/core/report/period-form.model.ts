/** One match of a period's form strip, read from the report tree. */
export interface FormMatch {
  /** `YYYY-MM-DD` of its session. */
  day: string;
  map: string;
  /** Squad rounds first, e.g. '13-7'. */
  score: string;
  /** Rounds won minus rounds lost: above zero a win, below a loss. */
  margin: number;
}
