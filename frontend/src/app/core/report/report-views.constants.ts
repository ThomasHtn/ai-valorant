/** One header tab of a report; `path` is the child route under `/report`. */
export interface ReportView {
  path: string;
  label: string;
  /** What the tab holds, shown when the pointer rests on it. */
  hint: string;
}

/** A block of the tab bar: its name above its tabs, on its own colour. */
export interface ReportViewGroup {
  label: string;
  /** Tailwind classes of the block: tinted ground, top edge and label colour. */
  tone: { block: string; label: string };
  views: readonly ReportView[];
}

/**
 * Header tabs in the order an analyst works: find what costs rounds, rewatch it, then dig into the
 * figures. Each group is a coloured block of the tab bar; green, red and amber stay out (results, active tab).
 */
export const REPORT_VIEW_GROUPS: readonly ReportViewGroup[] = [
  {
    label: 'Diagnostic',
    tone: { block: 'border-series-3 bg-series-3/10', label: 'text-[#b4a0ee]' },
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
    tone: { block: 'border-series-5 bg-series-5/10', label: 'text-[#8ab8e6]' },
    views: [
      { path: 'rounds', label: 'Rounds', hint: 'Chaque round en détail, avec son replay 2D' },
      { path: 'matches', label: 'Matchs', hint: 'Les matchs par session, avec leur scoreboard' },
      { path: 'minimap', label: 'Minimap', hint: "Où l'escouade meurt et tue, carte par carte" },
      { path: 'players', label: 'Joueurs', hint: 'La fiche de chaque joueur' },
    ],
  },
  {
    label: 'Explorer',
    tone: { block: 'border-series-2 bg-series-2/10', label: 'text-[#5cc9b8]' },
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
