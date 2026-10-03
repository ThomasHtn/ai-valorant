/** One header tab of a report; `path` is the child route under `/report`. */
export interface ReportView {
  path: string;
  label: string;
  /** What the tab holds, shown when the pointer rests on it. */
  hint: string;
}

/**
 * Header tabs in the order an analyst works: find what costs rounds, rewatch it, then dig into the
 * figures. Groups are separated in the tab bar and named by their `label`.
 */
export const REPORT_VIEW_GROUPS: readonly { label: string; views: readonly ReportView[] }[] = [
  {
    label: 'Diagnostic',
    views: [
      { path: 'summary', label: 'Résumé', hint: "L'essentiel de la période sur un écran" },
      {
        path: 'findings',
        label: 'Points forts et faibles',
        hint: "Les situations où l'escouade gagne ou perd des rounds face à la référence",
      },
    ],
  },
  {
    label: 'Revoir',
    views: [
      { path: 'rounds', label: 'Rounds', hint: 'Chaque round en détail, avec son replay 2D' },
      { path: 'matches', label: 'Matchs', hint: 'Les matchs par session, avec leur scoreboard' },
      { path: 'minimap', label: 'Minimap', hint: "Où l'escouade meurt et tue, carte par carte" },
      { path: 'players', label: 'Joueurs', hint: 'La fiche de chaque joueur' },
    ],
  },
  {
    label: 'Explorer',
    views: [
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
    ],
  },
];

/** Every view of a report, in tab order. */
export const REPORT_VIEWS: readonly ReportView[] = REPORT_VIEW_GROUPS.flatMap((g) => g.views);
