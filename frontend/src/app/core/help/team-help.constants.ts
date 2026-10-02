import { StatHelp } from './stat-help.model';

/** Team statistics of the period, map and session reports. */
export const TEAM_HELP = {
  roundsWon: {
    title: 'Rounds gagnés',
    what: 'Part des rounds gagnés sur tous les rounds joués.',
    read: 'Plus parlant que le nombre de matchs gagnés : un 13-11 et un 13-3 comptent tous les deux comme une victoire. Vert à partir de 55 %, rouge sous 45 %.',
  },
  sideRounds: {
    title: 'Attaque et défense',
    what: 'Part des rounds gagnés quand vous attaquez, puis quand vous défendez.',
    read: 'Sur la plupart des cartes, la défense gagne un peu plus de 50 % des rounds.',
  },
  pistols: {
    title: 'Pistol rounds',
    what: 'Rounds 1 et 13 de chaque match : rounds gagnés sur rounds joués.',
    read: "Un pistol gagné donne en général aussi le round suivant, l'adversaire étant en eco.",
  },
  teamFirstBlood: {
    title: 'First blood',
    what: "Part des rounds où c'est votre équipe qui fait le premier kill.",
    read: "50 % : autant que l'adversaire. Le premier kill pèse lourd : une équipe à 5v4 gagne environ 7 rounds sur 10.",
  },
  teamKast: {
    title: 'KAST équipe',
    what: 'KAST moyen des 5 joueurs : part des rounds où chacun a fait un kill, un assist, a survécu ou a été vengé (revenge).',
    read: 'Autour de 70 % : normal.',
  },
  teamTraded: {
    title: 'Morts avec revenge',
    what: 'Part de vos morts où un coéquipier tue le tueur dans les 3 secondes.',
    read: 'Élevé : vous jouez groupés et chaque mort est rentabilisée. Faible : vous mourez souvent seuls.',
  },
  postPlant: {
    title: 'Post-plant gagné',
    what: 'En attaque, part des rounds gagnés une fois le spike posé.',
    read: 'Le top ranked en gagne environ 3 sur 4.',
  },
  retake: {
    title: 'Retake réussi',
    what: "En défense, part des rounds gagnés quand l'adversaire a posé le spike : il faut le désamorcer à temps.",
    read: 'Le top ranked en gagne environ 1 sur 4 : un retake est difficile, mieux vaut empêcher le plant.',
  },
  plantShare: {
    title: 'Vos plants',
    what: 'Sur tous vos plants de la carte en attaque, part posés sur ce site.',
  },
  plantsAgainst: {
    title: 'Plants subis',
    what: 'Sur tous les plants adverses de la carte, part posés sur ce site quand vous défendez.',
  },
  convert: {
    title: 'Round gagné après le first blood',
    what: 'Quand votre équipe fait le premier kill (vous passez à 5v4), part des rounds que vous gagnez ensuite.',
    example: {
      text: "Après un first blood, les chances de gagner le round passent d'environ 50 % à 70 %.",
      swing: { from: 0.5, to: 0.7 },
    },
    read: "Sous 70 % : vous gâchez souvent l'avantage du nombre.",
  },
  recover: {
    title: 'Round gagné après la first death',
    what: 'Quand votre équipe subit le premier mort (vous passez à 4v5), part des rounds que vous gagnez quand même.',
    read: 'Autour de 30 % : normal. Au-dessus : vous savez remonter un round mal parti.',
  },
  medianFirstKill: {
    title: 'Premier kill (médiane)',
    what: "Moment du premier kill après le début du round : la moitié des rounds ont leur premier kill avant ce temps, l'autre moitié après.",
    read: "Petit : rounds joués vite, contacts tôt. Grand : rounds lents, plus de prises d'info.",
  },
  noPlant: {
    title: 'Rounds sans plant (hors eco)',
    what: "Part des rounds d'attaque où le spike n'est jamais posé, sans compter les rounds en eco.",
    read: 'Élevé : vous perdez souvent tout le monde avant même de poser le spike.',
  },
  plantTempo: {
    title: 'Tempo du plant',
    what: 'Moment où le spike est posé après le début du round : rapide (moins de 40 s), moyen (40 à 70 s) ou tardif (plus de 70 s).',
  },
  numbersAtPlant: {
    title: 'Joueurs en vie au plant',
    what: 'Vos joueurs en vie comparés aux leurs au moment où le spike est posé. « 1 de plus » : par exemple 4v3.',
  },
  situation: {
    title: 'Situation numérique',
    what: 'Joueurs en vie de chaque côté : 3v2 veut dire 3 des vôtres contre 2 adversaires.',
    how: "Un round compte dans une ligne s'il est passé par cette situation à un moment, même brièvement.",
  },
  throws: {
    title: 'Throws',
    what: "Rounds perdus alors que vous avez eu au moins 2 joueurs d'avance (5v3, 4v2...) à un moment du round.",
    how: "En pourcentage des rounds où vous avez eu cette avance. Plus c'est bas, mieux c'est.",
  },
  comebacks: {
    title: 'Comebacks',
    what: 'Rounds gagnés alors que vous avez eu 2 joueurs de moins ou pire (3v5, 2v4...) à un moment du round.',
    how: 'En pourcentage des rounds où vous avez été dans ce cas.',
  },
  sessionThrows: {
    title: 'Rounds throw',
    what: 'Rounds perdus alors que vos chances de gagner sont montées à 65 % ou plus à un moment, par exemple en 5v3 ou après un plant en 4v3.',
  },
  clutch: {
    title: 'Clutchs',
    what: "Le dernier joueur en vie de l'équipe face à 1, 2, 3 adversaires ou plus. Pourcentage de clutchs gagnés.",
    read: 'Le top ranked gagne environ 6 1v1 sur 10, 1 1v2 sur 5 et 1 1v3 sur 20.',
  },
  correlation: {
    title: 'Corrélation (r)',
    what: 'Mesure si une stat et le résultat montent et descendent ensemble, match après match. Va de -1 à +1.',
    read: "+0,5 et plus : quand cette stat est haute, vous gagnez nettement plus de rounds. Proche de 0 : aucun lien. Négatif : plus elle est haute, plus vous perdez. Ce n'est pas une preuve de cause.",
  },
  acsHighLow: {
    title: 'ACS haut et ACS bas',
    what: "Part des rounds gagnés par l'équipe dans les matchs où ce joueur fait mieux (haut) ou moins bien (bas) que son ACS habituel.",
    how: "« Habituel » : sa médiane, la moitié de ses matchs sont au-dessus, l'autre moitié en dessous.",
    read: "Grand écart entre les deux : l'équipe dépend beaucoup de la forme de ce joueur.",
  },
  buyMatrix: {
    title: 'Achats croisés',
    what: "Part des rounds gagnés selon votre achat (ligne) et celui de l'adversaire (colonne).",
    how: 'Équipement moyen par joueur : full buy à 3 700 crédits et plus, force buy de 1 500 à 3 700, eco en dessous de 1 500.',
  },
  buyShares: {
    title: 'Répartition des achats',
    what: 'Part des rounds joués en eco, en force buy et en full buy, sans les pistols.',
    read: 'Beaucoup de force buy : économie souvent cassée, ou forces trop fréquents.',
  },
  afterPistol: {
    title: 'Rounds qui suivent le pistol',
    what: "R2/R14 : le round juste après chaque pistol. R3/R15 : celui d'après.",
    read: "Après un pistol gagné, l'adversaire est en eco : ces rounds doivent se gagner le plus souvent.",
  },
  agentPresence: {
    title: 'Agents du top ranked',
    what: 'Part des équipes du top ranked qui jouent cet agent sur la carte, et leur part de victoires avec lui.',
    read: 'Plus stable que les compositions complètes, qui se répètent rarement en solo queue.',
  },
  presence: {
    title: 'Avec ou sans le joueur',
    what: "Résultats des matchs où ce joueur était dans le 5, puis de ceux où il n'y était pas.",
  },
  versusUsual: {
    title: "Par rapport à l'habituel",
    what: "Écart entre la soirée et la moyenne du joueur sur ses autres matchs. « = » : comme d'habitude.",
  },
  roundImpact: {
    title: 'Impact sur le round',
    what: "Part des rounds gagnés par l'équipe selon ce que le joueur a fait dans le round (first blood, mort tôt, 2 kills...).",
    read: 'À ne pas confondre avec la stat Impact : ici on regarde seulement si le round est gagné.',
  },
  earlyDeath: {
    title: 'Avant 25 s',
    what: 'Part de ces morts arrivées dans les 25 premières secondes du round.',
  },
  utility: {
    title: 'Utilitaire par round',
    what: "Nombre d'utilisations de chaque compétence par round : C, Q, E (la signature) et X (l'ultime).",
    read: "En rouge : moins de 70 % de l'usage du top ranked sur le même agent.",
  },
} satisfies Record<string, StatHelp>;
