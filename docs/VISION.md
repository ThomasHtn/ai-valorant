# AI Valorant : vision

## Objectif

Progresser en équipe : savoir clairement ce qui s'est passé, connaître nos points forts et nos points faibles,
et voir ce qui fonctionne chez les meilleurs joueurs.

## 1. Rapports factuels (code, sans IA)

| Rapport | Contenu |
|---|---|
| Session (après chaque soirée) | Par carte : erreurs qui reviennent souvent, ce qui a été inhabituel, rounds qu'on aurait dû gagner, avec la carte 2D |
| Période (mois, patch) | Points forts et points faibles, évolution d'une période à l'autre, rounds à revoir |

Règles :
- Référence : les adversaires de nos propres matchs (même elo) et notre historique.
- Un point fort ou faible de période n'est affiché que s'il passe un seuil statistique ; sinon il est marqué « piste ».
- Phrases simples, chaque point cite les rounds concernés.

## 2. Tendances du top ranked (IA)

Les 20 meilleurs joueurs de chaque région, matchs compétitifs des 7 derniers jours.

1. **Faits** : même extraction que pour l'escouade (sites, tempo, setups, retakes, économie, compos), par carte, side et patch.
2. **Modèle maison** : prédit l'issue d'un round à partir de ces faits, pour isoler ce qui est associé à la victoire (à économie égale).
3. **Synthèse IA** : un LLM rédige les tendances à partir des faits et du modèle, et les compare à ce que fait l'escouade.

## Données et technique

| Sujet | Choix |
|---|---|
| Source | Henrik (positions de tous les joueurs à chaque kill et plant, économie par round) ; clé partagée avec ValoQuests (30 req/min), collecte hors synchronisation |
| Cartes | valorant-api.com (callouts, minimaps) |
| Exécution | Local, RTX 4080 ; LLM local pour la rédaction |
| Application | API FastAPI + PostgreSQL, front Angular ; l'API sert aussi ValoQuests |

## Feuille de route

| Phase | Contenu | Réussie si |
|---|---|---|
| 1. Rapports factuels | Session et période, à partir du POC | Le groupe lit le rapport de session et en tire au moins un round à revoir |
| 2. Collecte top ranked | Leaderboards, matchs, mêmes faits que l'escouade | Plusieurs centaines de matchs par carte et par patch |
| 3. Tendances | Modèle maison et synthèse IA | Chaque tendance cite ses chiffres ; le groupe en essaie une |
| 4. ValoQuests | Pages Session, Période, Tendances | Le groupe consulte les rapports sans moi |

## Acquis du POC

- Données fiables : positions cohérentes avec les callouts, joueurs en vie lus dans les instantanés de kill (résurrections comprises).
- Les listes d'événements d'un seul match n'apprennent rien au groupe ; un point n'a de valeur que relié à notre historique.
- Volume : environ 20 matchs par carte avant qu'un écart par carte soit fiable.
