/** One header tab of a report; `path` is the child route under `/report`. */
export interface ReportView {
  path: string;
  label: string;
  /** What the tab holds, shown when the pointer rests on it. */
  hint: string;
}

/** Tabs of the report itself, in the order an analyst works: overview, what costs rounds, rewatch. */
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

/** Tool tabs, set apart at the end of the bar: each answers one precise question. */
export const REPORT_TOOL_VIEWS: readonly ReportView[] = [
  {
    path: 'tables',
    label: 'Toutes les stats',
    hint: 'Toutes les statistiques par thème, en tableaux',
  },
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

/** Every view of a report, in tab order. */
export const REPORT_VIEWS: readonly ReportView[] = [...REPORT_MAIN_VIEWS, ...REPORT_TOOL_VIEWS];
