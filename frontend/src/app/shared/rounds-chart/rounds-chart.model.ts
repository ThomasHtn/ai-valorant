/** One bar of a rounds chart: rounds won (+) or lost (-) against the reference. */
export interface RoundsBar {
  key: string;
  label: string;
  rounds: number;
  /** Greyed: too few rounds to trust. */
  thin: boolean;
}
