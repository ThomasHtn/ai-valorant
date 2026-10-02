export interface GlossaryEntry {
  term: string;
  definition: string;
}

/** Definition of an individual statistic, with display hints. */
export interface StatDefinition {
  key: string;
  label: string;
  kind: 'mean' | 'rate';
  higherIsBetter: boolean;
  decimals: number;
  signed: boolean;
  definition: string;
}

export interface Glossary {
  terms: GlossaryEntry[];
  stats: StatDefinition[];
}

/** Collected matches of one source (`squad` or `top`) and when its facts were last rebuilt. */
export interface SourceStatus {
  source: 'squad' | 'top';
  matches: number;
  latestMatch: string | null;
  factsBuiltAt: string | null;
}

export interface DataStatus {
  sources: SourceStatus[];
}
