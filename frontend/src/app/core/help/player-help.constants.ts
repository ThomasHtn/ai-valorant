import { StatHelp } from './stat-help.model';

/**
 * Individual statistics. Keys match the API's stat keys (`backend/.../players/metrics.py`) so the
 * full stats table finds its explanation without a mapping.
 */
export const PLAYER_HELP = {
  acs: {
    title: 'ACS',
    what: 'Le score de combat du tableau des scores de Valorant, en moyenne par round.',
    how: "Calculé par Riot : 1 point par dégât infligé, et un kill rapporte de 70 à 150 points selon le nombre d'adversaires encore en vie. Les multi-kills et les assists ajoutent un bonus.",
    read: 'Vert à partir de 230, rouge sous 180. Autour de 200 : niveau moyen du lobby. Les duellistes ont naturellement un ACS plus haut.',
  },
  kd: {
    title: 'K/D',
    what: 'Nombre de kills divisé par le nombre de morts.',
    read: "Au-dessus de 1 : le joueur tue plus souvent qu'il ne meurt. Vert à partir de 1,1, rouge sous 0,9.",
  },
  kpr: {
    title: 'Kills par round',
    what: 'Nombre moyen de kills par round joué.',
    read: '0,8 : environ 4 kills tous les 5 rounds.',
  },
  dpr: {
    title: 'Morts par round',
    what: "Nombre moyen de morts par round joué. Plus c'est bas, mieux c'est.",
    read: '0,7 : le joueur meurt dans 7 rounds sur 10.',
  },
  apr: {
    title: 'Assists par round',
    what: "Nombre moyen d'assists par round : dégâts, flash ou compétence qui aident un coéquipier à faire le kill.",
  },
  adr: {
    title: 'ADR',
    what: 'Dégâts infligés par round, en moyenne.',
    how: 'Tous les dégâts faits aux adversaires, divisés par le nombre de rounds joués. Les dégâts sur un adversaire qui survit comptent aussi.',
    read: 'Vert à partir de 155, rouge sous 125. Autour de 140 : moyen.',
  },
  kast: {
    title: 'KAST',
    what: "Part des rounds où le joueur a servi à quelque chose : il a fait un Kill, un Assist, il a Survécu, ou il est mort mais un coéquipier l'a vengé (revenge).",
    read: 'Vert à partir de 73 %, rouge sous 65 % (beaucoup de rounds où il meurt sans rien apporter).',
  },
  survival: {
    title: 'Survie',
    what: 'Part des rounds où le joueur est encore en vie à la fin du round.',
    read: "Un lurk ou une sentinelle survit plus souvent qu'un entry.",
  },
  hs: {
    title: 'Headshots',
    what: 'Part des balles qui touchent un adversaire et arrivent dans la tête.',
    how: 'Tirs à la tête divisés par tous les tirs qui touchent (tête, corps, jambes). Les tirs ratés ne comptent pas.',
    read: 'Vert à partir de 25 %, rouge sous 17 %. Autour de 20 % : courant.',
  },
  fbpr: {
    title: 'First bloods par round',
    what: 'Combien de fois, en moyenne par round, le joueur fait le premier kill du round.',
    read: '0,15 : un first blood environ tous les 7 rounds.',
  },
  fdpr: {
    title: 'First deaths par round',
    what: "Combien de fois, en moyenne par round, le joueur est le premier mort du round. Plus c'est bas, mieux c'est.",
  },
  fbfd: {
    title: 'First bloods - first deaths',
    what: 'Nombre de premiers kills du round faits par le joueur, puis nombre de fois où il a été le premier mort.',
    read: 'Vert quand il fait plus de first bloods que de first deaths, rouge dans le cas inverse.',
  },
  opening: {
    title: "Duels d'ouverture gagnés",
    what: "Quand le joueur prend part au premier kill du round, part des fois où c'est lui qui tue.",
    how: 'First bloods / (first bloods + first deaths).',
    read: "Vert à partir de 55 %, rouge sous 45 %. Un entry peut être sous 50 % et rester utile si l'équipe venge sa mort.",
  },
  revenge_given: {
    title: 'Revenges données par round',
    what: 'Kills qui vengent un coéquipier : le joueur tue son tueur dans les 3 secondes.',
  },
  traded: {
    title: 'Morts avec revenge',
    what: 'Part des morts du joueur où un coéquipier tue son tueur dans les 3 secondes.',
    read: "Élevé : il joue près de l'équipe, sa mort est vite rentabilisée. Faible : il meurt souvent seul.",
  },
  zero_dmg: {
    title: 'Morts à 0 dégât',
    what: "Part des morts du joueur où il n'a fait aucun dégât dans le round. Plus c'est bas, mieux c'est.",
    read: 'Signe de morts sans pouvoir répondre : pris de dos, angle mal choisi, peek isolé.',
  },
  multi: {
    title: 'Rounds à 2 kills ou plus',
    what: 'Part des rounds où le joueur fait au moins 2 kills.',
  },
  impact: {
    title: 'Impact',
    what: 'Combien le joueur fait monter ou baisser les chances de son équipe de gagner le round, en moyenne par round.',
    how: "D'après tous nos matchs, on connaît les chances de gagner un round selon les joueurs en vie, le side et le spike. Chaque kill, mort ou plant les fait bouger : le tueur gagne l'écart, la victime le perd.",
    example: {
      text: 'À 5v5, environ 50 % de chances de gagner le round. Après un first blood (5v4), environ 70 % : +20 pour le tueur, -20 pour la victime.',
      swing: { from: 0.5, to: 0.7 },
    },
    read: "+3 : il ajoute 3 % de chances de gagner à chaque round. Vert à partir de +1, rouge sous -1. Contrairement au K/D, un kill en 1v1 compte bien plus qu'un kill à 5v1.",
  },
} satisfies Record<string, StatHelp>;
