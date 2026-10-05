import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';

import { parseRoundParam, roundLink } from '@core/report/round-ref.utils';

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
      { path: '', pathMatch: 'full', redirectTo: 'squad' },
      {
        path: 'squad',
        loadComponent: () => import('@pages/report/squad/squad-view').then((m) => m.SquadView),
      },
      {
        path: 'sessions',
        loadComponent: () =>
          import('@pages/report/sessions/sessions-view').then((m) => m.SessionsView),
      },
      {
        path: 'sessions/:day',
        loadComponent: () =>
          import('@pages/report/sessions/session-page/session-page').then((m) => m.SessionPage),
      },
      {
        path: 'strategy',
        loadComponent: () =>
          import('@pages/report/strategy/strategy-view').then((m) => m.StrategyView),
      },
      {
        path: 'strategy/:map',
        loadComponent: () =>
          import('@pages/report/strategy/strategy-view').then((m) => m.StrategyView),
      },
      // Older addresses, now inside a main tab.
      { path: 'summary', redirectTo: 'squad' },
      { path: 'debrief', redirectTo: 'sessions' },
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
        // Old address of a round sheet ('<matchId>_<n>'): the round now lives under its match.
        path: 'rounds/:round',
        redirectTo: ({ params, queryParams }) => {
          const ref = parseRoundParam(params['round']);
          const tree = inject(Router).createUrlTree(ref ? roundLink(ref) : ['/report/rounds'], {
            queryParams,
          });
          return tree;
        },
      },
      { path: 'matches', pathMatch: 'full', redirectTo: 'sessions' },
      {
        // A match always opens on one of its rounds, the first by default.
        path: 'matches/:match',
        pathMatch: 'full',
        redirectTo: ({ params, queryParams }) =>
          inject(Router).createUrlTree(roundLink({ matchId: params['match'], roundNumber: 1 }), {
            queryParams,
          }),
      },
      {
        path: 'matches/:match/rounds/:round',
        loadComponent: () =>
          import('@pages/report/matches/match-round/match-round').then((m) => m.MatchRound),
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
