import { Routes } from '@angular/router';

import { NotFound } from '@pages/not-found/not-found';

/**
 * Application routes. The period is carried by query parameters (`?month=2026-09`, `?patch=13.05`,
 * `?start=…&end=…`) so each tab keeps it while the reader moves around. Pages are lazy: the period
 * report owns `chart.js`, and every page brings its own icons, which would otherwise all weigh on
 * the first load.
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('@pages/home/home').then((m) => m.Home),
    title: 'ValoStats',
  },
  {
    path: 'sessions/:day',
    loadComponent: () => import('@pages/session/session-page').then((m) => m.SessionPage),
    title: 'Soirée · ValoStats',
  },
  {
    path: 'periods',
    loadComponent: () => import('@pages/period/period-page').then((m) => m.PeriodPage),
    title: 'Rapport · ValoStats',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'team' },
      {
        path: 'team',
        loadComponent: () => import('@pages/period/team/team-tab').then((m) => m.TeamTab),
      },
      {
        path: 'team/:group',
        loadComponent: () => import('@pages/period/team/team-tab').then((m) => m.TeamTab),
      },
      {
        path: 'maps',
        loadComponent: () => import('@pages/period/maps/maps-tab').then((m) => m.MapsTab),
      },
      {
        path: 'maps/:map',
        loadComponent: () => import('@pages/period/maps/maps-tab').then((m) => m.MapsTab),
      },
      {
        path: 'players',
        loadComponent: () => import('@pages/period/players/players-tab').then((m) => m.PlayersTab),
      },
      {
        path: 'players/:puuid',
        loadComponent: () => import('@pages/period/players/players-tab').then((m) => m.PlayersTab),
      },
      {
        path: 'glossary',
        loadComponent: () =>
          import('@pages/period/glossary/glossary-tab').then((m) => m.GlossaryTab),
      },
    ],
  },
  { path: '**', component: NotFound, title: 'Page introuvable · ValoStats' },
];
