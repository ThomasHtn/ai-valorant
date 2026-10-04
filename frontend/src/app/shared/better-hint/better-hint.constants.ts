/** Short reading rule of a figure, as analysts write it ("higher is better"). */
export const BETTER_LABELS: Readonly<Record<1 | -1, string>> = {
  1: 'Plus haut = mieux',
  [-1]: 'Plus bas = mieux',
};

/** What the green arrow means, shown on hover. */
export const BETTER_SENTENCES: Readonly<Record<1 | -1, string>> = {
  1: 'La flèche verte montre le bon sens : pour ce chiffre, une valeur plus haute est meilleure.',
  [-1]: 'La flèche verte montre le bon sens : pour ce chiffre, une valeur plus basse est meilleure (moins de morts, moins de pertes).',
};
