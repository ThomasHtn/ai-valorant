/** Value of the "Qui" select meaning the whole squad. */
export const TEAM_SUBJECT = 'team';

/** One point per month, per patch or per match. */
export type Granularity = 'month' | 'patch' | 'match';

export const GRANULARITIES: readonly { key: Granularity; label: string }[] = [
  { key: 'month', label: 'Mois' },
  { key: 'patch', label: 'Patch' },
  { key: 'match', label: 'Match' },
];

/** Points under this sample turn grey (rounds, or player-rounds for individual stats). */
export const TREND_MIN_SAMPLE = 20;

/** Squad metrics drawn as small multiples under the chart, by month. */
export const SMALL_MULTIPLES: readonly string[] = [
  'roundsWon',
  'attack',
  'defense',
  'wonAfterFirstDeath',
  'retake',
  'revengeDeaths',
];

/** Metric plotted per match: rounds won share for the squad, ACS for a player. */
export const MATCH_METRIC = { team: 'roundsWon', player: 'acs' } as const;

/** Glossary keys of the metrics the API sends without one. */
export const TREND_HELP_FALLBACK: Readonly<Record<string, string>> = {
  firstBlood: 'firstBloodRate',
  wonAfterFirstBlood: 'wonAfterFirstBlood',
  wonAfterFirstDeath: 'wonAfterFirstDeath',
  postPlant: 'spikePostPlantWon',
  retake: 'spikeRetakeWon',
  revengeDeaths: 'deathsRevenged',
  headshots: 'headshotRate',
  firstDeathsPerRound: 'fdPerRound',
  firstBloodsPerRound: 'firstBloodsPerRound',
};

/** Abbreviated French months, for the x axis ('sept. 2026'). */
export const SHORT_MONTHS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];
