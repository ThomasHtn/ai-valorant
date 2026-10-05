/** Tables of the themes whose figures a main tab already holds: Explorer only links to them. */
export const MAIN_TAB_TABLES: Readonly<Record<string, { tab: string; path: string }>> = {
  'results-maps': { tab: 'Escouade, Cartes', path: '/report/squad' },
  'results-round-types': { tab: 'Escouade, Économie', path: '/report/squad' },
  'opening-side': { tab: 'Escouade, Ouvertures', path: '/report/squad' },
  'combat-players': { tab: 'Escouade, Effectif', path: '/report/squad' },
  'spike-sites': { tab: 'Escouade, Post-plant et Retakes', path: '/report/squad' },
  'agents-top-compos': { tab: 'Stratégie', path: '/report/strategy' },
  'agents-top-presence': { tab: 'Stratégie', path: '/report/strategy' },
};
