/** Views of a report, in the order of the header tabs; `path` is the child route under `/report`. */
export const REPORT_VIEWS: readonly { path: string; label: string }[] = [
  { path: 'tables', label: 'Tableaux' },
  { path: 'findings', label: 'Points forts et faibles' },
  { path: 'compare', label: 'Comparateur' },
  { path: 'minimap', label: 'Minimap' },
  { path: 'rounds', label: 'Rounds' },
  { path: 'matches', label: 'Matchs' },
  { path: 'players', label: 'Joueurs' },
  { path: 'trend', label: 'Tendance' },
  { path: 'distribution', label: 'Distribution' },
];
