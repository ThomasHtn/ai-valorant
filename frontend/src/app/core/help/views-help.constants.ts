import { StatHelp } from './stat-help.model';

/** Vues du rapport: what each statistic means, how it is counted and how to read it. */
export const VIEWS_HELP: Readonly<Record<string, StatHelp>> = {
  roundStrip: {
    title: 'Rounds du match',
    what: "Un carré par round, vert gagné, rouge perdu, avec le side et l'achat de l'escouade.",
    how: 'P pistol, E eco, F force buy, FB full buy. Un clic ouvre la fiche du round.',
    read: 'Une série de carrés rouges en début de mi-temps montre souvent un pistol perdu puis un R2 et un R3 perdus.',
  },
  lossCause: {
    title: 'Cause du round perdu',
    what: "La raison principale d'un round perdu, trouvée automatiquement dans le déroulé du round.",
    how: "Première règle qui s'applique, dans cet ordre : avantage perdu (mené de 2 joueurs ou plus), clutch perdu (1v1 atteint), post-plant perdu, retake raté, ouverture perdue (first death sans revenge, jamais revenu à égalité), écart économique (eco ou force buy contre full buy), temps écoulé, exécution ratée (attaque sans plant), sinon duels perdus.",
    read: "Une cause par round : c'est un tri pour savoir quels rounds revoir, pas un verdict.",
  },
  winProb: {
    title: 'Probabilité de victoire',
    what: "Les chances de l'escouade de gagner le round après chaque kill, plant ou defuse.",
    how: 'Part des rounds gagnés par les équipes du top ranked dans la même situation : joueurs en vie de chaque côté, side, spike posé ou non. Le round commence à 50 %.',
    read: "La ligne rouge marque l'événement qui fait le plus chuter les chances : c'est le moment où le round bascule.",
  },
  replay2d: {
    title: 'Replay 2D',
    what: 'La position des 10 joueurs sur la minimap à chaque kill, plant ou defuse du round.',
    how: 'Positions fournies par Henrik au moment de chaque événement. Entre deux événements, les déplacements ne sont pas connus.',
    read: 'La croix rouge marque le joueur qui vient de mourir, le contour orange celui qui agit.',
  },
  mmFirstDeaths: {
    title: 'First deaths sur la carte',
    what: "Où meurt le premier joueur de l'escouade dans le round.",
    how: "Position de la victime au moment du premier kill du round, quand la victime est de l'escouade.",
  },
  mmFirstBloods: {
    title: 'First bloods sur la carte',
    what: "D'où l'escouade prend le premier kill du round.",
    how: "Position du tueur de l'escouade au moment du premier kill du round.",
  },
  mmIsolated: {
    title: 'Morts isolées',
    what: 'Morts sans coéquipier en vie à proximité pour aider ou prendre la revenge.',
    how: 'Aucun coéquipier vivant à moins de 15 m (1 500 unités) de la victime au moment du kill.',
  },
  mmKillerSpots: {
    title: 'Positions des tueurs adverses',
    what: "D'où les adversaires tuent l'escouade.",
    how: "Position du tueur adverse à chaque mort de l'escouade.",
  },
  mmZones: {
    title: 'Zones',
    what: "Ce qui se passe dans chaque zone de la carte pour l'escouade, sur le side choisi.",
    how: "Chaque position est rattachée au callout le plus proche (valorant-api). Morts : position de la victime. Kills : position du tueur de l'escouade.",
  },
  mmFdShare: {
    title: 'Part des first deaths',
    what: "Part des first deaths de l'escouade qui ont lieu dans cette zone, à comparer au top ranked sur la même carte et le même side.",
    how: "First deaths de l'escouade dans la zone divisées par toutes ses first deaths du side. Le trait clair marque la part du top ranked.",
    read: "Une barre bien plus longue que le trait : l'escouade meurt en premier à cet endroit plus souvent que le top ranked.",
  },
};
