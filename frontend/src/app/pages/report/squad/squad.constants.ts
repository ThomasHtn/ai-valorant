import { DashTone, VerdictKey } from './squad.model';

/** Sections of the Escouade page, in order, for the side list. */
export const SQUAD_SECTIONS: readonly { id: string; label: string }[] = [
  { id: 'squad-overview', label: 'Bilan' },
  { id: 'squad-habits', label: 'Habitude ou carte' },
  { id: 'squad-priorities', label: 'Priorités' },
  { id: 'squad-strengths', label: 'Ce qui marche' },
  { id: 'squad-maps', label: 'Cartes' },
  { id: 'squad-economy', label: 'Économie' },
  { id: 'squad-opening', label: 'Ouvertures' },
  { id: 'squad-post-plant', label: 'Post-plant' },
  { id: 'squad-retakes', label: 'Retakes' },
  { id: 'squad-roster', label: 'Effectif' },
];

/** Distance (px) under the top of the scroller at which a section counts as being read. */
export const SECTION_READ_OFFSET = 120;

/** Under half a round a gap reads as even (white). */
export const FLAT_ROUNDS = 0.5;
/** Past 3 rounds a gap gets a stronger ground. */
export const STRONG_ROUNDS = 3;
/** A headline change under half a point reads as stable. */
export const FLAT_POINTS = 0.005;
/** Months with fewer matches draw a hollow dot. */
export const MIN_MONTH_MATCHES = 3;

/** Text colour of a figure per tone. */
export const DASH_TEXTS: Record<DashTone, string> = {
  good: 'text-rating-good-soft',
  bad: 'text-rating-bad-soft',
  flat: 'text-text-primary',
  thin: 'text-text-muted',
};

/** Ground and text of a pill per tone; `strong` deepens the ground past 3 rounds. */
export const DASH_PILLS: Record<DashTone, { base: string; strong: string }> = {
  good: {
    base: 'bg-rating-good/15 text-rating-good-soft',
    strong: 'bg-rating-good/28 text-rating-good-soft',
  },
  bad: {
    base: 'bg-rating-bad/17 text-rating-bad-soft',
    strong: 'bg-rating-bad/32 text-rating-bad-soft',
  },
  flat: {
    base: 'bg-text-primary/8 text-text-secondary',
    strong: 'bg-text-primary/8 text-text-secondary',
  },
  thin: { base: 'bg-text-primary/5 text-text-muted', strong: 'bg-text-primary/5 text-text-muted' },
};

/** Ring stroke tone per dash tone, in `app-ring-gauge` terms. */
export const DASH_RINGS: Record<DashTone, 'good' | 'bad' | 'small' | null> = {
  good: 'good',
  bad: 'bad',
  flat: null,
  thin: 'small',
};

/** Words of a map verdict and the classes of their pill. */
export const VERDICTS: Record<VerdictKey, { label: string; pill: string }> = {
  solid: { label: 'Solide', pill: 'bg-rating-good/16 text-rating-good-soft' },
  stabilize: { label: 'À stabiliser', pill: 'bg-brand-500/16 text-brand-400' },
  work: { label: 'À travailler', pill: 'bg-rating-bad/18 text-rating-bad-soft' },
  test: { label: 'À tester', pill: 'bg-text-primary/8 text-text-secondary' },
  collecting: { label: 'Collecte en cours', pill: 'bg-text-primary/8 text-text-secondary' },
};

/** Buys in the order the economy card lists them; the bonus round has no slice of its own. */
export const BUY_ORDER = ['full', 'force', 'pistol', 'eco', 'bonus'] as const;

/** Slice colour of each buy in the economy donut. */
export const BUY_COLORS: Record<string, string> = {
  full: 'var(--color-squad)',
  force: 'var(--color-accent-violet)',
  pistol: 'var(--color-brand-500)',
  eco: 'var(--color-series-2)',
};

/** Lines of the headline chart, one colour each. */
export const TREND_COLORS = {
  rounds: 'var(--color-brand-500)',
  firstDuels: 'var(--color-accent-blue)',
  pistols: 'var(--color-accent-purple)',
} as const;

/** Lost rounds donut: after a first death, despite a first blood. */
export const LOST_COLORS = {
  afterDeath: 'var(--color-rating-bad)',
  despiteBlood: 'var(--color-brand-500)',
} as const;

/** A priority losing rounds on this many readable maps or more is a habit of the squad. */
export const HABIT_MIN_MAPS = 4;

/** Buys the Rounds view can filter on, for the rewatch link of a buy line. */
export const REWATCH_BUYS: Record<string, string> = {
  full: 'full',
  force: 'force',
  eco: 'eco',
  pistol: 'pistol',
};

/** Sites drawn as columns of the post-plant and retake grids. */
export const SITES = ['A', 'B', 'C'] as const;
