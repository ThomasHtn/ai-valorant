# ValoStats: Frontend

Angular single-page application for the ValoStats analysis space: the report, its six tabs and its
Explorer menu, with every period (months, sessions, patches) one click away in the top bar. It reads everything from the
[backend API](../backend/README.md) and never computes a statistic itself: it formats numbers and picks
colours.

| | |
|---|---|
| Framework | Angular 22, standalone components, signals, no NgModules |
| Language | TypeScript 6, strict |
| Styling | Tailwind 4 plus the ValoQuests design system in `src/styles/` |
| Icons and charts | `@lucide/angular`, hand-written SVG charts (`shared/line-chart`, `shared/histogram`) |
| Tests | Vitest with jsdom |
| Gates | Prettier, `ng build` |

## Getting started

Requirements: Node.js 22, and the backend running on `localhost:8000`.

```bash
npm ci
npm start        # dev server on :4200, proxies /api to localhost:8000
```

`proxy.conf.json` keeps both sides on the same origin during development, so no CORS setup is needed.

## Commands

```bash
npm start                                                          # dev server
npm test -- --watch=false                                          # the whole suite
npm test -- --include=src/app/core/report/tone.utils.spec.ts       # a single spec
npm run format                                                     # format:check is the gate
npm run build                                                      # production bundle in dist/
```

## Structure

Path aliases: `@core/*`, `@shared/*`, `@layout/*`, `@pages/*`.

| Folder | What lives there |
|---|---|
| `core/report/` | Models mirroring the API DTOs, `ReportApi`, the period context, preferences and filters, the colour rule (`tone.utils.ts`) |
| `core/format/` | Number formatting and the French labels of enum values |
| `core/help/` | Every stat explained in player words, one file per domain, shown by the "i" tips |
| `core/game-assets/` | Paths of the game pictures: agents, maps, minimaps, weapons, roles, ranks |
| `core/http/` | `api-endpoints.ts`, resource helpers |
| `pages/` | `not-found`, and `report/` with its top bar parts (`period-switcher`, `period-pulse`, `report-tabs`, `explore-menu`) and one folder per view |
| `layout/` | The frame (`shell`) and the top bar (`page-header`) |
| `shared/` | Presentational primitives: coloured stat table, filter bar, badges, minimap canvas, charts, tiles, tips |
| `styles/` | Copied from ValoQuests; only `valostats.css` and the last section of `styles.css` belong to this project |

A component is `x.ts` + `x.html`, with its view models in `x.model.ts`, its constants in
`x.constants.ts` and its pure helpers in `x.utils.ts`, tested in `x.utils.spec.ts`.

## Routing

| Route | Screen |
|---|---|
| `/` | Redirects to `/report`, the latest month |
| `/report/<view>` | Month, patch or history tabs: `summary`, `findings`, `matches`, `rounds`, `minimap`, `players`. Explorer: `tables/<theme>`, `compare`, `trend`, `distribution`. Session tabs: `debrief`, `matches`, `players` |
| `/report/matches/<id>/rounds/<n>` | One round under its match: replay, timeline, win chances, economy |

The period lives in the URL (`?month=2026-09`, `?patch=13.06`, `?start=...&end=...`, a session being
`start=end`), so any report is shareable. Every page is lazy loaded, and route and query parameters are
bound to component inputs (`withComponentInputBinding`).

## Data access

- Every backend URL is declared once in `core/http/api-endpoints.ts`. Components never build URLs.
- `ReportApi` exposes `httpResource<T>()` bound to signals, so a change of period or filter refetches on
  its own and consumers share one request.
- Read a resource through `resourceValue(resource, fallback)` (`core/http/resource-state.utils.ts`):
  `value()` throws once the resource is in error.
- The API base is relative (`/api`): in production the app is served from the same origin as the API.

## Design rules

- Dark only, same palette and fonts as ValoQuests. Take colours from `styles/colors.css` and
  `styles/valostats.css`, never invent them.
- Square surfaces: only badges are rounded.
- A cell is green (good), amber (within 3 points of the reference, 5% for an average), red (bad), or grey
  under the minimum sample. The rule lives in `core/report/tone.utils.ts`.
- Inputs and selects never use the light navy surface (`surface-800`).
- Never pass a child component an array or object built by a method called in the template
  (`[details]="details(x)"`): a new object on every pass loops change detection and freezes the page.
  Prepare it in a `computed`.

## Game pictures

`public/assets/valorant/` holds agents, maps, minimaps, ranks, roles and weapons, fetched from Data Dragon and
valorant-api.com. Rerun the script after a patch that adds an agent or a map:

```bash
uv run --with pillow python scripts/fetch_valorant_assets.py
```

## Docker

`Dockerfile` builds the production bundle on `node:22-alpine` and serves it with nginx (`nginx.conf`):
hashed bundles cached for a year, game pictures for an hour, the shell never cached, and unknown paths
falling back to `index.html`. In production Traefik terminates HTTPS and routes `/api/*` to the backend
on the same origin (see [`docker-compose.prod.yml`](../docker-compose.prod.yml)).

```bash
docker build -t valostats-frontend .
docker run --rm -p 8080:80 valostats-frontend
```

---

Product overview: [root README](../README.md) · architecture: [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).
