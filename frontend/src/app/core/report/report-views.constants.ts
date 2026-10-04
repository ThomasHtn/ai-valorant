/** One view of a report; `path` is the child route under `/report`. */
export interface ReportView {
  path: string;
  label: string;
  /** What the view holds: a tab's hover hint, a line under an Explorer entry. */
  hint: string;
}

/** Tabs of a month, a patch or the whole history: the period, what costs rounds, then the detail. */
export const REPORT_MAIN_VIEWS: readonly ReportView[] = [
  { path: 'summary', label: 'Résumé', hint: "L'essentiel de la période sur un écran" },
  {
    path: 'findings',
    label: 'Points forts et faibles',
    hint: "Les situations où l'escouade gagne ou perd des rounds face à la référence",
  },
  {
    path: 'matches',
    label: 'Matchs',
    hint: 'Les matchs par session : scoreboard et rounds perdus',
  },
  {
    path: 'rounds',
    label: 'Rounds',
    hint: 'Pourquoi les rounds sont perdus, et chacun en replay 2D',
  },
  { path: 'minimap', label: 'Minimap', hint: "Où l'escouade meurt et tue, carte par carte" },
  { path: 'players', label: 'Joueurs', hint: 'La fiche de chaque joueur' },
];

/** Tabs of a single session: too few rounds for gaps or trends, so the matches come first. */
export const SESSION_VIEWS: readonly ReportView[] = [
  {
    path: 'debrief',
    label: 'Débrief',
    hint: 'La session face au mois : bilan, matchs, joueurs, rounds qui ont basculé',
  },
  {
    path: 'matches',
    label: 'Matchs',
    hint: 'Chaque match de la session, puis chacun de ses rounds',
  },
  { path: 'players', label: 'Joueurs', hint: 'La fiche de chaque joueur sur la session' },
];

/** First view of each kind of period, where a missing view sends the analyst. */
export const SESSION_HOME = 'debrief';
export const PERIOD_HOME = 'summary';

/** Every statistic by theme, opened on a theme from the Explorer menu. */
export const REPORT_STATS_VIEW: ReportView = {
  path: 'tables',
  label: 'Stats par thème',
  hint: "Toutes les statistiques d'un thème, en tableaux",
};

/** Tools of the Explorer menu: each answers one precise question. */
export const REPORT_TOOL_VIEWS: readonly ReportView[] = [
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
