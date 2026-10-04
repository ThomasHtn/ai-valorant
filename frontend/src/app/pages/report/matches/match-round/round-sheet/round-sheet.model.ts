/** A line of the sheet's summary that can select an event of the round. */
export interface SummaryMoment {
  text: string;
  /** Event to select on click, null when the moment is not an event (the start of the round). */
  step: number | null;
}

/** What the sheet says about a round, in a few short sentences. */
export interface RoundSummary {
  won: boolean;
  /** 'Perdu · Élimination'. */
  outcome: string;
  cause: { label: string; reason: string } | null;
  best: SummaryMoment | null;
  key: SummaryMoment | null;
}
