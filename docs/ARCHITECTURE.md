# Architecture

## Vue d'ensemble

```
Henrik API ──┐                     ┌── match_fact, round_fact, kill_fact,        ┌── FastAPI ── Angular
ValoQuests ──┼─> ingestion ─> match (JSON brut) ─> extraction ─> player_round_fact... ─> analysis/report ─> DTO JSON
valorant-api ┘                     └── win_probability                           └── (ValoQuests plus tard)
```

1. **Collecte** (`ingestion/`) : les matchs Henrik sont stockés tels quels dans la table `match` (colonne JSONB). C'est la
   source de vérité : tout le reste se recalcule à partir d'elle.
2. **Extraction des faits** (`analysis/extraction/`) : chaque match devient des lignes simples (une équipe par match, une
   équipe par round, un kill, un joueur par round, un joueur par match). Les faits d'une source (`squad` ou `top`) sont
   reconstruits en entier après chaque collecte, car l'impact d'un kill dépend de la table de probabilité de victoire.
3. **Rapport** (`analysis/report/`) : fonctions pures qui prennent les faits d'une période et renvoient les DTO. Aucune
   base, aucun HTTP : c'est ce qui les rend faciles à tester.
4. **Services** (`services/`) : chargent les faits en mémoire (une fois, puis à chaque nouvelle reconstruction), découpent
   la période et gardent les résultats en cache.
5. **API** (`api/`) : routes FastAPI minces sous `/api/report`. La doc interactive est sur `http://localhost:8000/docs`.
6. **Front** (`frontend/`) : affiche les DTO. Il formate les nombres et choisit les couleurs ; il ne calcule aucune stat.

## Backend (`backend/src/valostats/`)

| Dossier | Rôle | Règle |
|---|---|---|
| `constants/` | Règles du jeu, seuils, un fichier par sujet (`game`, `weapons`, `timings`, `findings`...) | Un seuil ne s'écrit jamais en dur ailleurs |
| `domain/` | Enums, faits (`facts.py`), cartes | Dataclasses immuables, sans dépendance |
| `db/models/` | Une table par fichier (SQLAlchemy) | Toute modification passe par une migration Alembic |
| `repositories/` | Lecture et écriture en base | Seul endroit qui écrit du SQL |
| `clients/` | Henrik, ValoQuests (lecture seule), valorant-api | Seul endroit qui fait du HTTP sortant |
| `ingestion/` | Collecte et reconstruction des faits | Appelé par la CLI (`cli.py`) |
| `analysis/extraction/` | Payload Henrik vers faits, un module par type de fait | Fonctions pures |
| `analysis/report/` | Calcul de chaque vue du rapport (détail ci-dessous) | Fonctions pures |
| `analysis/statistics/` | Tests de proportions, Benjamini-Hochberg | |
| `schemas/report/` | DTO Pydantic, un fichier par vue | JSON en camelCase, jamais de couleur |
| `services/` | `facts_store` (faits en mémoire), `report_service` (cache par période), `match_service` (matchs et fiches de round) | |
| `api/routes/` | `report`, `report_matches`, `report_players`, `report_insights`, `reference` | Pas de logique métier |

### Le rapport (`analysis/report/`)

| Sous-dossier | Contenu |
|---|---|
| `foundation/` | Cohortes d'une période (`cohorts.py`), cases avec références (`cells.py`), constructeur de tableaux (`table_builder.py`), règles communes (`death_rules.py`), période (`period_selection.py`) |
| `domains/` | Vue Toutes les stats : un module par domaine du dictionnaire (`results.py`, `combat.py`...), registre dans `__init__.py` |
| `rounds/` | Causes des rounds perdus, matchs, fiche de round (depuis le payload), minimap |
| `insights/` | Points forts et faibles (tests statistiques), détections automatiques, tendances, distributions |
| `players/` | Fiche joueur |
| `overview/` | Arbre de l'accueil (sessions, mois) et en-tête du rapport (période, qualité des données) |

### Vocabulaire des faits

- `cohort` : `squad` (l'escouade), `opp` (ses adversaires dans les mêmes matchs), `top` (matchs du top ranked).
- `side` : `att` ou `def`. `round_index` commence à 0 ; l'API affiche `roundNumber` = index + 1.
- Un kill est `avenged` (revenge) si un coéquipier de la victime tue le tueur dans les 3 secondes.
- Distances en unités du jeu (100 = 1 m). Les dates sont en heure de Paris (sessions, mois).

### Références de comparaison

Chaque case d'un tableau porte la valeur de l'escouade, son échantillon, et la même mesure pour trois références : top
ranked, adversaires des mêmes matchs, historique de l'escouade avant la période. Le front colore la case selon la
référence choisie par l'analyste.

- Lignes par joueur : top ranked et adversaires sont limités au même rôle, l'historique au joueur lui-même.
- Mesures symétriques (rounds gagnés, pistols, first blood pris tous sides confondus) : comparées à l'historique, car le
  top ranked y vaut toujours 50 % et les adversaires sont le miroir.
- Points forts et faibles : test de proportions, correction de Benjamini-Hochberg (« écart net ») ou p < 0,05 seul
  (« à confirmer »). Adversaires pour le jeu d'équipe, top ranked pour les mesures à somme nulle et la méta. Le front
  regroupe les écarts par sujet (carte, joueur) : le plus coûteux mène, les autres comptent les mêmes rounds et ne
  s'additionnent pas.
- Le front écrit « vs historique » sous les colonnes comparées à l'historique quelle que soit la référence choisie.
  La vue Joueurs a sa propre référence, « Adversaires » par défaut.

### Ajouter une stat : exemple

Ajouter « rounds gagnés en eco » au tableau des résultats par carte :

1. `analysis/report/domains/results.py` : déclarer la colonne puis la case de chaque ligne.
   ```python
   t.column("eco", "Eco gagnés", help="ecoWon")
   ...
   "eco": cell(cohorts, FactKind.ROUNDS, ratio(lambda r: r.won, lambda r: r.buy is BuyType.ECO), map_name=m),
   ```
   Rien d'autre côté backend : le DTO `StatTable` est générique.
2. Ajouter un test dans `backend/tests/unit/` si la règle n'est pas triviale.
3. Le front affiche automatiquement la nouvelle colonne.
4. Expliquer la stat pour les joueurs : une entrée `ecoWon` dans `frontend/src/app/core/help/<domaine>-help.constants.ts`,
   affichée par l'icône « i » et dans le Glossaire.

Ajouter un domaine : écrire `domains/<clé>.py` avec `tables(cohorts) -> list[StatTable]`, puis l'inscrire dans
`domains/__init__.py` et dans `REPORT_DOMAINS` côté front.

Si la stat a besoin d'un champ nouveau dans les faits : l'ajouter dans `domain/facts.py`, dans le modèle `db/models/`,
le calculer dans `analysis/extraction/`, créer une migration (`uv run alembic revision --autogenerate -m "..."`), puis
`uv run valostats rebuild-facts`.

## Frontend (`frontend/src/app/`)

| Dossier | Rôle |
|---|---|
| `core/report/` | Modèles (`*.model.ts`, miroir des DTO), `ReportApi`, contexte de la période (`ReportContext`), filtres et affichage propres à chaque vue (`ViewState`, fourni par `provideViewState`), règle de couleur (`tone.utils.ts`) |
| `core/format/` | Formatage des nombres et libellés français des valeurs d'enum |
| `core/help/` | Explications des stats en langage de joueur, un fichier par domaine ; infobulles « i » et Glossaire |
| `core/game-assets/` | Chemin des images du jeu (agents, cartes, minimaps, armes, rôles, rangs) |
| `shared/` | Composants réutilisables : tableau coloré (`stat-table`), barre de filtres, légende, qualité des données, icône de rang, minimap avec points, graphiques (`line-chart`, `histogram`), tuile de chiffre, liens de round |
| `pages/home`, `pages/glossary` | Accueil (mois, sessions, patchs) et glossaire |
| `pages/report/` | Coque du rapport (sélecteur de période, onglets) et une page par vue : `summary` (onglet par défaut, assemblé à partir des autres endpoints), `tables`, `findings`, `compare`, `minimap`, `rounds`, `matches`, `players`, `trend`, `distribution` |
| `layout/` | Barre du haut (Accueil, Glossaire), en-tête de page |
| `src/styles*` | Copiés de ValoQuests ; seuls `styles/valostats.css` et la dernière section de `styles.css` sont propres au projet |

Conventions reprises de ValoQuests : composants standalone avec `input()`, services qui exposent des `httpResource`,
toutes les URL dans `core/http/api-endpoints.ts`, un composant = `x.ts` + `x.html`, utilitaires purs testés dans
`*.utils.spec.ts`.

Navigation : l'accueil liste les rapports ; un rapport s'ouvre sur `/report/<vue>` avec la période dans l'URL
(`?month=2026-09`, `?patch=13.06`, `?start=…&end=…`, une session étant `start=end`). Les onglets (vues à gauche,
outils à droite, `report-views.constants.ts`) ne gardent que la période. Les liens profonds ajoutent
des filtres : `/report/rounds?map=Split&side=def&result=lost|won&preset=throws`, `/report/minimap/Split?side=def&player=X`. Les onglets du rapport n'existent pas
sur l'accueil. `/report/matches` liste les sessions en cartes de match ; `/report/matches/<id>` montre le match seul, sous un
fil d'Ariane (`shared/breadcrumb`) avec le match précédent et suivant. La fiche de round a le même fil d'Ariane et passe
au round précédent ou suivant de la liste filtrée. Le sens d'une stat s'affiche avec `shared/better-hint`
(« Plus haut = mieux »), jamais en phrase. Couleurs : vert bien, orange moyen (à moins de 3 points de la référence, 5 % pour une moyenne), rouge pas
bien, gris sous l'échantillon minimum. Les champs de saisie n'utilisent jamais la surface bleue `surface-800`.

Images du jeu : `frontend/public/assets/valorant/`, tirées de Data Dragon et de valorant-api (rangs, minimaps, rôles)
par `uv run --with pillow python frontend/scripts/fetch_valorant_assets.py`, à relancer après un patch qui ajoute un
agent ou une carte.

Piège à connaître : ne jamais passer à un composant enfant un tableau ou un objet construit par une méthode appelée dans le
template (`[details]="details(x)"`). Un nouvel objet à chaque passage relance la détection de changements en boucle et
gèle la page. Préparer ces valeurs dans un `computed`.

## Base de données

PostgreSQL 17 dans Docker (port 5433). Le schéma est défini par les migrations `backend/migrations/versions/`. La table
`match` est la source de vérité : une sauvegarde (`pg_dump`) suffit pour tout reconstruire avec `uv run valostats rebuild-facts`.
