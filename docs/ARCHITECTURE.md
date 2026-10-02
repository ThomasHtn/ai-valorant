# Architecture

## Vue d'ensemble

```
Henrik API ──┐                     ┌── round_fact, death_fact,          ┌── FastAPI ── Angular
ValoQuests ──┼─> ingestion ─> match (JSON brut) ─> extraction ─> player_round_fact... ─> analyses ─> DTO JSON
valorant-api ┘                     └── win_probability                  └── (ValoQuests plus tard)
```

1. **Collecte** (`ingestion/`) : les matchs Henrik sont stockés tels quels dans la table `match` (colonne JSONB). C'est la
   source de vérité : tout le reste se recalcule à partir d'elle.
2. **Extraction des faits** (`analysis/extraction/`) : chaque match devient des lignes simples (un round par équipe, une
   mort, un joueur par round, un joueur par match). Les faits d'une source (`squad` ou `top`) sont reconstruits en entier
   après chaque collecte, car l'impact d'un kill dépend de la table de probabilité de victoire, calculée sur tous les matchs.
3. **Analyses** (`analysis/`) : fonctions pures qui prennent des listes de faits et renvoient les DTO. Aucune base, aucun
   HTTP, aucun HTML : c'est ce qui les rend faciles à tester.
4. **Services** (`services/`) : chargent les faits en mémoire (une fois, puis à chaque nouvelle reconstruction), choisissent
   la période et appellent les analyses. Les résultats d'une période sont gardés en cache.
5. **API** (`api/`) : routes FastAPI minces. La doc interactive est sur `http://localhost:8000/docs`.
6. **Front** (`frontend/`) : affiche les DTO. Il formate les nombres et choisit les couleurs ; il ne calcule aucune stat.

## Backend (`backend/src/valostats/`)

| Dossier | Rôle | Règle |
|---|---|---|
| `constants/` | Règles du jeu, seuils statistiques, endpoints Henrik, libellés français | Un seuil ne s'écrit jamais en dur ailleurs |
| `domain/` | Types métier : enums, faits (`facts.py`), cartes | Dataclasses immuables, sans dépendance |
| `db/models/` | Une table par fichier (SQLAlchemy) | Toute modification passe par une migration Alembic |
| `repositories/` | Lecture et écriture en base | Seul endroit qui écrit du SQL |
| `clients/` | Henrik, ValoQuests (lecture seule), valorant-api | Seul endroit qui fait du HTTP sortant |
| `ingestion/` | Collecte et reconstruction des faits | Appelé par la CLI (`cli.py`) |
| `analysis/` | Calcul des stats, un module par section de rapport | Fonctions pures |
| `schemas/` | DTO Pydantic renvoyés par l'API | JSON en camelCase, comme ValoQuests |
| `services/` | Assemblage des analyses, cache | |
| `api/` | Routes, dépendances, erreurs | Pas de logique métier |

Les analyses renvoient directement les DTO de `schemas/` : une couche de types intermédiaires identiques n'apporterait rien.

### Vocabulaire des faits

- `cohort` : `squad` (l'escouade), `opp` (ses adversaires dans les mêmes matchs), `top` (matchs du top ranked).
- `side` : `att` ou `def`. `round_index` commence à 0 ; l'API affiche `round_number` = index + 1.
- Une mort est `traded` (revenge) si un coéquipier tue le tueur dans les 3 secondes.
- Les dates sont en heure de Paris dans les faits chargés (soirées, mois).

### Références de comparaison

- Points forts et faibles : escouade contre ses adversaires des mêmes matchs (même elo), test statistique corrigé par
  Benjamini-Hochberg (`analysis/period/findings.py`). « confirmé » = passe la correction, « piste » = p < 0,05.
- Sections de jeu (économie, duels, sites…) : contre le top ranked, car les adversaires y seraient le miroir exact de
  l'escouade (un duel gagné par nous est un duel perdu par eux).

### Ajouter une stat : exemple

Ajouter « rounds gagnés en eco » à la fiche carte :

1. `analysis/maps/map_sheet.py` : ajouter un `kpi("eco", "Eco gagnés", lambda r: r.won, lambda r: r.buy is BuyType.ECO)` dans la
   liste `kpis`. Rien d'autre côté backend : le DTO `MapKpi` existe déjà.
2. Ajouter un test dans `backend/tests/` si la règle n'est pas triviale.
3. Le front affiche automatiquement la nouvelle tuile (boucle sur `kpis`).
4. Expliquer la stat pour les joueurs : une entrée dans `frontend/src/app/core/help/*-help.constants.ts`, affichée
   par l'icône « i » (`<app-info-tip topic="..." />`) et dans l'onglet Glossaire ; pour une tuile de fiche carte,
   relier sa clé à l'explication dans `MAP_KPI_HELP`.

Si la stat a besoin d'un champ nouveau dans les faits : l'ajouter dans `domain/facts.py`, dans le modèle `db/models/`,
le calculer dans `analysis/extraction/`, créer une migration (`uv run alembic revision --autogenerate -m "..."`), puis
`uv run valostats rebuild-facts`.

## Frontend (`frontend/src/app/`)

| Dossier | Rôle |
|---|---|
| `core/<domaine>/` | Modèles TypeScript (`*.model.ts`, miroir des DTO), services d'accès (`*-api.ts`), utilitaires (`*.utils.ts`) |
| `core/format/` | Formatage des nombres et libellés des valeurs d'enum |
| `core/help/` | Explications des stats en langage de joueur (infobulles et glossaire) |
| `core/rating/` | Code couleur des stats : seuils (`rating.constants.ts`) et écart à une référence, vert / orange / rouge |
| `core/navigation/` | Pages du rapport (sidebar) et parties de l'onglet Équipe |
| `core/game-assets/` | Chemin des images du jeu (agents, cartes, armes, rôles) à partir des noms renvoyés par l'API |
| `shared/` | Composants réutilisables : badge (carte, side, joueur, statut), onglets (`tabs/`), images du jeu (`game-art/`), cellule colorée, bande de stats, ligne de point, minimap, graphiques (`chart/`, repris de ValoQuests, Chart.js) |
| `pages/` | Écrans : accueil (arbre mois > rapport + soirées), session (bannière par match), période (équipe, cartes, joueurs, glossaire) |
| `layout/` | Sidebar plate (une entrée par écran), barre de contexte des pages |
| `src/styles*` | Copiés de ValoQuests (`colors`, `typography`, `elevation`, utilitaires de `styles.css`) ; seuls `styles/valostats.css` et la dernière section de `styles.css` sont propres au projet |

Conventions reprises de ValoQuests : composants standalone avec `input()`, services `@Service()` qui exposent des
`httpResource`, toutes les URL dans `core/http/api-endpoints.ts`, un écran = `x.ts` + `x.html`. La période choisie vit dans
l'URL (`?month=2026-09`, `?patch=13.05`, `?start=…&end=…`), partagée par les onglets et la sidebar via `PeriodContext`
(`core/periods/`).

Navigation : la sidebar choisit l'écran (Équipe, Cartes, Joueurs…), sans sous-menu ; le titre de la page est le
sélecteur de période. Dans la page, au plus deux niveaux : un sélecteur illustré (`PickerTabs` : bannières de cartes,
portraits d'agents) puis un contrôle segmenté pour les parties (`LinkTabs` dans l'URL pour l'équipe, `SegmentedTabs`
sans URL pour une fiche). Les chiffres clés s'affichent dans une bande (`STAT_BAND_CLASS`), les points en lignes
compactes (`app-point-card`, rounds à revoir repliés). Une portée (carte, side, joueur) ou un statut s'affiche avec
`<app-badge>`, jamais en texte capitales espacées.

Images du jeu : `frontend/public/assets/valorant/`, tirées de Data Dragon par
`uv run --with pillow python frontend/scripts/fetch_valorant_assets.py` (à relancer après un patch qui ajoute un
agent ou une carte, puis compléter `core/game-assets/game-assets.constants.ts`).

Piège à connaître : ne jamais passer à un composant enfant un tableau ou un objet construit par une méthode appelée dans le
template (`[details]="details(x)"`). Un nouvel objet à chaque passage relance la détection de changements en boucle et
gèle la page. Préparer ces valeurs dans un `computed` (voir `shared/point-card/finding-list.ts`).

## Base de données

PostgreSQL 17 dans Docker (port 5433). Le schéma est défini par les migrations `backend/migrations/versions/`. Pour repartir
de zéro : `docker compose down -v`, `make db migrate import`.
