/** One view of a report; `path` is the child route under `/report`. */
export interface ReportView {
  path: string;
  label: string;
  /** What the view holds: a tab's hover hint, a line under an Explorer entry. */
  hint: string;
}

/** Main tabs: what the squad reads most, each opening on its conclusion. */
export const REPORT_MAIN_VIEWS: readonly ReportView[] = [
  { path: 'squad', label: 'Escouade', hint: "L'essentiel de l'escouade sur la période" },
  {
    path: 'sessions',
    label: 'Sessions',
    hint: 'Chaque session, puis ses matchs, puis leurs rounds',
  },
  { path: 'players', label: 'Joueurs', hint: 'La fiche de chaque joueur' },
  {
    path: 'strategy',
    label: 'Stratégie',
    hint: 'Ce que joue le top ranked sur chaque carte, et pourquoi il gagne plus',
  },
];

/** First view of a period, where a missing view sends the analyst. */
export const PERIOD_HOME = 'squad';

/** Every secondary statistic by theme, opened on a theme from the Explorer menu. */
export const REPORT_STATS_VIEW: ReportView = {
  path: 'tables',
  label: 'Stats par thème',
  hint: "Les statistiques secondaires d'un thème, en tableaux",
};

/** Tools of the Explorer menu: each answers one precise question. */
export const REPORT_TOOL_VIEWS: readonly ReportView[] = [
  {
    path: 'findings',
    label: 'Points forts et faibles',
    hint: 'Les écarts testés, avec les rounds derrière chacun',
  },
  { path: 'rounds', label: 'Rounds', hint: 'Pourquoi les rounds sont perdus, et chacun en replay' },
  { path: 'minimap', label: 'Minimap', hint: "Où l'escouade meurt et tue, carte par carte" },
  {
    path: 'compare',
    label: 'Comparer',
    hint: 'Deux périodes, deux équipes ou deux joueurs côte à côte',
  },
  { path: 'trend', label: 'Évolution', hint: 'Une statistique mois après mois' },
  {
    path: 'distribution',
    label: 'Répartition',
    hint: 'Comment se répartissent les timings, distances et scores',
  },
];

/** Views gathered behind the Explorer menu rather than given a tab each. */
export const REPORT_EXPLORE_VIEWS: readonly ReportView[] = [
  REPORT_STATS_VIEW,
  ...REPORT_TOOL_VIEWS,
];
