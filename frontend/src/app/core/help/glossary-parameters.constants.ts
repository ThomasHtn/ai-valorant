/** Fixed thresholds used by several definitions, listed at the top of the glossary. */
export const GLOSSARY_PARAMETERS: readonly { name: string; value: string; use: string }[] = [
  { name: 'Revenge', value: '3 s', use: 'Un coéquipier tue votre tueur dans les 3 secondes.' },
  {
    name: 'Mort isolée',
    value: '15 m',
    use: 'Aucun coéquipier vivant à moins de 15 m (1 500 unités) au moment de la mort.',
  },
  {
    name: 'Eco',
    value: '< 1 500 crédits',
    use: "Valeur moyenne de l'équipement de l'équipe en début de round.",
  },
  {
    name: 'Full buy',
    value: '≥ 3 700 crédits',
    use: "Valeur moyenne de l'équipement de l'équipe. Force buy entre les deux.",
  },
  {
    name: 'Plant rapide, moyen, tardif',
    value: '40 s et 70 s',
    use: 'Temps du plant depuis le début du round.',
  },
  { name: 'Mort précoce', value: '20 s', use: 'Mort avant 20 secondes de round.' },
  {
    name: 'Avantage',
    value: '2 joueurs',
    use: "Throw : round perdu après avoir mené de 2 joueurs ou plus. Comeback : l'inverse.",
  },
  { name: "Distance d'engagement", value: '10 m et 25 m', use: 'Courte, moyenne, longue.' },
  {
    name: 'Échantillon minimum',
    value: '20 rounds',
    use: 'En dessous (10 pour un joueur sur une carte), la case reste grise.',
  },
  {
    name: 'Couleur',
    value: '3 points',
    use: 'Orange à moins de 3 points de la référence (5 % pour une moyenne).',
  },
];
