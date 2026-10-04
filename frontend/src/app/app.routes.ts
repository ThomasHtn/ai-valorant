import { Routes } from '@angular/router';

import { NotFound } from '@pages/not-found/not-found';

/**
 * Application routes. The period is carried by query parameters (`?month=2026-09`, `?patch=13.05`,
 * `?start=…&end=…`, a session being `start = end`) so every report view keeps it while the analyst
 * moves around. Pages are lazy so each brings only its own code and icons.
 */
export const routes: Routes = [
  // The report is the home: the period switcher in its top bar lists every period.
  { path: '', pathMatch: 'full', redirectTo: 'report' },
  {
    path: 'report',
    loadComponent: () => import('@pages/report/report-page').then((m) => m.ReportPage),
    title: 'Rapport · ValoStats',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'summary' },
      {
        path: 'summary',
        loadComponent: () =>
          import('@pages/report/summary/summary-view').then((m) => m.SummaryView),
      },
      {
        path: 'tables',
        loadComponent: () => import('@pages/report/tables/tables-view').then((m) => m.TablesView),
      },
      {
        path: 'tables/:domain',
        loadComponent: () => import('@pages/report/tables/tables-view').then((m) => m.TablesView),
      },
      {
        path: 'findings',
        loadComponent: () =>
          import('@pages/report/findings/findings-view').then((m) => m.FindingsView),
      },
      {
        path: 'compare',
        loadComponent: () =>
          import('@pages/report/compare/compare-view').then((m) => m.CompareView),
      },
      {
        path: 'minimap',
        loadComponent: () =>
          import('@pages/report/minimap/minimap-view').then((m) => m.MinimapView),
      },
      {
        path: 'minimap/:map',
        loadComponent: () =>
          import('@pages/report/minimap/minimap-view').then((m) => m.MinimapView),
      },
      {
        path: 'rounds',
        loadComponent: () => import('@pages/report/rounds/rounds-view').then((m) => m.RoundsView),
      },
      {
        path: 'rounds/:round',
        loadComponent: () => import('@pages/report/rounds/rounds-view').then((m) => m.RoundsView),
      },
      {
        path: 'matches',
        loadComponent: () =>
          import('@pages/report/matches/matches-view').then((m) => m.MatchesView),
      },
      {
        path: 'matches/:match',
        loadComponent: () =>
          import('@pages/report/matches/matches-view').then((m) => m.MatchesView),
      },
      {
        path: 'players',
        loadComponent: () =>
          import('@pages/report/players/players-view').then((m) => m.PlayersView),
      },
      {
        path: 'players/:player',
        loadComponent: () =>
          import('@pages/report/players/players-view').then((m) => m.PlayersView),
      },
      {
        path: 'trend',
        loadComponent: () => import('@pages/report/trend/trend-view').then((m) => m.TrendView),
      },
      {
        path: 'distribution',
        loadComponent: () =>
          import('@pages/report/distribution/distribution-view').then((m) => m.DistributionView),
      },
    ],
  },
  { path: '**', component: NotFound, title: 'Page introuvable · ValoStats' },
];
