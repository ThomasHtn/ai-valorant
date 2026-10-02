import { StatHelp } from './stat-help.model';

/** Team statistics of the period, map and session reports. */
export const TEAM_HELP = {
  roundsWon: {
    title: 'Rounds gagnés',
    what: 'Le pourcentage de rounds gagnés.',
    read: 'Plus parlant que les victoires : un 13-11 et un 13-3 comptent pareil. Vert dès 55 %, rouge sous 45 %.',
  },
  sideRounds: {
    title: 'Winrate attaque et défense',
    what: 'Votre winrate de chaque côté : le pourcentage de rounds gagnés quand vous attaquez, puis quand vous défendez.',
    how: 'Tous les rounds joués de ce côté comptent, que vous ayez commencé le match en attaque ou en défense, prolongations comprises.',
    read: 'Sur la plupart des cartes, la défense gagne un peu plus de la moitié des rounds.',
  },
  pistols: {
    title: 'Pistol rounds',
    what: 'Rounds 1 et 13 de chaque match : pistols gagnés sur pistols joués.',
    read: "Un pistol gagné fait souvent gagner le round d'après aussi : l'adversaire est en eco.",
  },
  teamFirstBlood: {
    title: 'First blood',
    what: 'Le pourcentage de rounds où votre équipe fait le first blood.',
    read: "50 % : autant que l'adversaire. Ça pèse lourd : à 5v4, on gagne environ 7 rounds sur 10.",
  },
  teamKast: {
    title: 'KAST équipe',
    what: 'Le KAST moyen des 5 : le pourcentage de rounds où chacun fait un kill, un assist, survit, ou meurt et se fait venger par une revenge.',
    read: 'Autour de 70 % : normal.',
  },
  teamTraded: {
    title: 'Morts avec revenge',
    what: 'Le pourcentage de vos morts où un coéquipier prend la revenge dans les 3 secondes.',
    read: 'Haut : vous jouez groupés, chaque mort se paie. Bas : vous mourez souvent seuls.',
  },
  teamNoDamage: {
    title: 'Morts sans dégât infligé',
    what: "Le pourcentage de vos morts où le joueur n'a fait aucun dégât dans le round. Plus c'est bas, mieux c'est.",
    read: 'Haut : vous vous faites surprendre (pris de dos, peek seul, mauvais angle).',
  },
  postPlant: {
    title: 'Post-plants gagnés',
    what: 'En attaque, le pourcentage de rounds gagnés une fois le spike posé.',
    read: 'Le top ranked en gagne environ 3 sur 4.',
  },
  retake: {
    title: 'Retakes réussis',
    what: "En défense, le pourcentage de rounds gagnés quand l'adversaire a planté : il faut defuse à temps.",
    read: "Le top ranked n'en gagne qu'environ 1 sur 4 : un retake, c'est dur, mieux vaut empêcher le plant.",
  },
  plantShare: {
    title: 'Vos plants',
    what: 'En attaque, le pourcentage de vos plants posés sur ce site.',
  },
  plantsAgainst: {
    title: 'Plants subis',
    what: 'En défense, le pourcentage des plants adverses posés sur ce site.',
  },
  convert: {
    title: 'Rounds gagnés après un first blood',
    what: 'Quand vous faites le first blood (5v4), le pourcentage de rounds que vous gagnez derrière.',
    example: {
      text: "Après un first blood, les chances de gagner le round passent d'environ 50 % à 70 %.",
      swing: { from: 0.5, to: 0.7 },
    },
    read: "Sous 70 % : vous lâchez souvent l'avantage.",
  },
  recover: {
    title: 'Rounds gagnés après une first death',
    what: 'Quand vous prenez la first death (4v5), le pourcentage de rounds que vous gagnez quand même.',
    read: 'Autour de 30 % : normal. Au-dessus : vous savez sauver des rounds mal partis.',
  },
  medianFirstKill: {
    title: 'Premier kill (médiane)',
    what: "Le moment habituel du premier kill : dans la moitié des rounds, il tombe avant ce temps, dans l'autre moitié après.",
    read: "Court : rounds rapides, contact tôt. Long : rounds lents, plus de prise d'info.",
  },
  noPlant: {
    title: 'Attaques sans plant (hors eco)',
    what: "Le pourcentage de rounds d'attaque sans plant, rounds en eco mis à part.",
    read: 'Haut : vous perdez souvent tout le monde avant de planter.',
  },
  plantTempo: {
    title: 'Tempo du plant',
    what: 'Quand le spike est posé : rapide (avant 40 s), moyen (40 à 70 s) ou tardif (après 70 s).',
  },
  numbersAtPlant: {
    title: 'Joueurs en vie au plant',
    what: 'Vos joueurs en vie face aux leurs au moment du plant. « 1 de plus » : par exemple 4v3.',
  },
  drivers: {
    title: 'Rounds gagnés par situation',
    what: 'Pour chaque situation, le pourcentage de rounds que vous gagnez, à côté de celui des top ranked dans la même situation.',
    read: 'Écart : la différence en points avec le top ranked. Vert : vous faites mieux. Rouge : moins bien. En gris : moins de 5 rounds, pas assez pour conclure.',
  },
  equipmentGap: {
    title: "Écart d'équipement",
    what: "La valeur de votre équipement (armes, armures, compétences des 5 joueurs) moins celle de l'adversaire, en crédits, au début du round.",
    example: {
      text: 'Vous en full buy (Vandal, armure) contre leur force buy (Spectre) : environ 4 000 crédits de plus.',
    },
  },
  situation: {
    title: 'Situation numérique',
    what: "Joueurs en vie de chaque côté : 3v2, c'est 3 des vôtres contre 2.",
    how: "Un round compte dès qu'il est passé par cette situation, même un instant.",
  },
  throws: {
    title: 'Throws',
    what: 'Rounds perdus alors que vous avez eu 2 joueurs de plus (5v3, 4v2...) à un moment.',
    how: "En pourcentage des rounds où vous avez eu cette avance. Plus c'est bas, mieux c'est.",
  },
  comebacks: {
    title: 'Comebacks',
    what: 'Rounds gagnés alors que vous avez eu 2 joueurs de moins ou pire (3v5, 2v4...) à un moment.',
    how: 'En pourcentage des rounds où ça vous est arrivé.',
  },
  sessionThrows: {
    title: 'Throws de la session',
    what: 'Rounds perdus alors que vous aviez à un moment 65 % de chances ou plus de les gagner, par exemple en 5v3 ou en 4v3 après le plant.',
  },
  clutch: {
    title: 'Clutchs',
    what: "Le dernier en vie de l'équipe face à 1, 2, 3 adversaires ou plus : le pourcentage de clutchs gagnés.",
    read: 'Le top ranked gagne environ 6 1v1 sur 10, 1 1v2 sur 5 et 1 1v3 sur 20.',
  },
  correlation: {
    title: 'Corrélation (r)',
    what: "Dit si une stat et vos rounds gagnés montent et baissent ensemble, d'un match à l'autre. Va de -1 à +1.",
    read: "+0,5 ou plus : quand cette stat est haute, vous gagnez nettement plus de rounds. Proche de 0 : aucun lien. Négatif : plus elle est haute, plus vous perdez. Un lien ne prouve pas que c'est la cause.",
  },
  acsHighLow: {
    title: 'ACS haut et ACS bas',
    what: "Le pourcentage de rounds gagnés par l'équipe quand ce joueur fait un ACS au-dessus de son habitude (haut), puis en dessous (bas).",
    how: '« Son habitude » : la moitié de ses matchs au-dessus, la moitié en dessous.',
    read: "Gros écart entre les deux : l'équipe dépend beaucoup de sa forme.",
  },
  buyMatrix: {
    title: "Rounds gagnés selon l'achat",
    what: "Le pourcentage de rounds gagnés en pistol, puis selon votre achat et celui d'en face.",
    how: "Selon la valeur moyenne de l'équipement par joueur : full buy dès 3 700 crédits, force buy de 1 500 à 3 700, eco en dessous.",
  },
  buyShares: {
    title: 'Répartition des achats',
    what: 'Le pourcentage de rounds joués en eco, en force buy et en full buy, pistols à part.',
    read: "Beaucoup de force buys : l'économie casse souvent, ou vous forcez trop.",
  },
  afterPistol: {
    title: 'Rounds qui suivent le pistol',
    what: "Le round d'après : round 2 ou 14. Le suivant : round 3 ou 15.",
    read: "Après un pistol gagné, vous jouez l'anti-eco : ces rounds doivent tomber presque à chaque fois.",
  },
  agentPresence: {
    title: 'Agents du top ranked',
    what: "Le pourcentage d'équipes du top ranked qui jouent cet agent sur la carte, et leur pourcentage de victoires avec.",
    read: 'Plus fiable que les compos complètes, qui se répètent rarement en solo queue.',
  },
  presence: {
    title: 'Avec ou sans le joueur',
    what: "Les résultats quand ce joueur est dans le 5, puis quand il n'y est pas.",
  },
  versusUsual: {
    title: "Par rapport à l'habituel",
    what: "L'écart entre la session et ses autres matchs. « = » : comme d'habitude.",
  },
  roundImpact: {
    title: 'Impact sur le round',
    what: "Le pourcentage de rounds gagnés par l'équipe selon ce que le joueur a fait dans le round (first blood, mort tôt, 2 kills...).",
    read: 'Différent de la stat Impact : ici, on regarde seulement si le round est gagné.',
  },
  earlyDeath: {
    title: 'Avant 25 s',
    what: 'Le pourcentage de ces morts dans les 25 premières secondes du round.',
  },
  utility: {
    title: 'Utilitaire par round',
    what: "Combien de fois il utilise chaque compétence par round : C, Q, E (la signature) et X (l'ulti).",
    read: "En rouge : moins de 70 % de ce qu'utilise le top ranked sur le même agent.",
  },
} satisfies Record<string, StatHelp>;
