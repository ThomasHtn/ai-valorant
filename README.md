# ValoStats

Statistiques d'équipe à partir des 5-stacks compétitifs de l'escouade (voir `VISION.md`) : une API qui calcule les rapports
de session et de période, et un front qui les affiche. L'API est faite pour être consommée aussi par ValoQuests.

| Dossier | Contenu |
|---|---|
| `backend/` | API FastAPI (Python 3.12), collecte Henrik, calcul des stats, PostgreSQL |
| `frontend/` | Application Angular 22 + Tailwind, même design system que ValoQuests |
| `docs/ARCHITECTURE.md` | Comment le code est organisé et comment ajouter une stat |
| `data/` | Anciens fichiers JSON, importés une fois en base (hors git) |
| `legacy/` | Ancienne version en scripts, gardée pour référence |

## Démarrage

Prérequis : Docker (avec le plugin `docker compose`), [uv](https://docs.astral.sh/uv/), Node 22.

```bash
cp backend/.env.example backend/.env    # renseigner VALOQUESTS_DATABASE_URL et HENRIK_API_KEY
make db                                 # PostgreSQL sur le port 5433
cd backend && uv sync && cd ..
cd frontend && npm ci && cd ..
make migrate
make import                             # une seule fois : importe data/ (environ 2 minutes)
make api                                # http://localhost:8000/docs
make front                              # http://localhost:4200
```

## Collecte

```bash
make sync        # après chaque soirée : 5-stacks depuis ValoQuests et l'historique Henrik
make sync-top    # une fois par semaine : top 20 de chaque région, 7 derniers jours (environ 1 h 30)
```

`sync-top` partage le quota Henrik avec ValoQuests. Après chaque collecte, les faits sont recalculés et l'API les recharge
d'elle-même.

## Qualité

```bash
make test        # pytest + vitest
make lint        # ruff, mypy strict, prettier
```
