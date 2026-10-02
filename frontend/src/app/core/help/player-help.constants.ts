import { StatHelp } from './stat-help.model';

/**
 * Individual statistics. Keys match the API's stat keys (`backend/.../players/metrics.py`) so the
 * full stats table finds its explanation without a mapping.
 */
export const PLAYER_HELP = {
  acs: {
    title: 'ACS',
    what: 'Le score de combat moyen par round, celui du tableau des scores en partie.',
    how: "Calculé par Riot : 1 point par dégât, et chaque kill rapporte de 70 à 150 points selon le nombre d'adversaires encore en vie. Les multi-kills et les assists donnent un bonus.",
    read: "Vert dès 230, rouge sous 180. Autour de 200, c'est la moyenne du lobby. Les duellistes ont naturellement un ACS plus haut.",
  },
  kd: {
    title: 'K/D',
    what: 'Ses kills divisés par ses morts.',
    read: "Au-dessus de 1, il tue plus qu'il ne meurt. Vert dès 1,1, rouge sous 0,9.",
  },
  kpr: {
    title: 'Kills par round',
    what: 'Ses kills par round, en moyenne.',
    read: '0,8 : environ 4 kills tous les 5 rounds.',
  },
  dpr: {
    title: 'Morts par round',
    what: "Ses morts par round, en moyenne. Plus c'est bas, mieux c'est.",
    read: '0,7 : il meurt 7 rounds sur 10.',
  },
  apr: {
    title: 'Assists par round',
    what: 'Ses assists par round, en moyenne. Un assist : des dégâts, une flash ou une compétence qui aide un coéquipier à faire le kill.',
  },
  adr: {
    title: 'ADR',
    what: 'Ses dégâts par round, en moyenne.',
    how: 'Tous les dégâts comptent, même sur un adversaire qui survit.',
    read: "Vert dès 155, rouge sous 125. Autour de 140, c'est moyen.",
  },
  kast: {
    title: 'KAST',
    what: 'Le pourcentage de rounds où il apporte quelque chose : il fait un Kill, un Assist, il Survit, ou il meurt et un coéquipier prend la revenge.',
    read: 'Vert dès 73 %, rouge sous 65 % : trop de rounds où il meurt sans rien apporter.',
  },
  survival: {
    title: 'Survie',
    what: 'Le pourcentage de rounds où il est encore en vie à la fin.',
    read: "Un lurker ou une sentinelle survit plus souvent qu'un entry.",
  },
  hs: {
    title: 'Headshots',
    what: 'Parmi ses balles qui touchent, le pourcentage qui touche la tête.',
    how: 'Les tirs ratés ne comptent pas.',
    read: "Vert dès 25 %, rouge sous 17 %. Autour de 20 %, c'est courant.",
  },
  fbpr: {
    title: 'First bloods par round',
    what: 'Combien de fois il fait le premier kill du round, en moyenne par round.',
    read: '0,15 : un first blood tous les 7 rounds environ.',
  },
  fdpr: {
    title: 'First deaths par round',
    what: "Combien de fois il est le premier mort du round, en moyenne par round. Plus c'est bas, mieux c'est.",
  },
  fbfd: {
    title: 'First bloods - first deaths',
    what: 'Ses first bloods, puis ses first deaths.',
    read: 'Vert quand il fait plus de first bloods que de first deaths, rouge sinon.',
  },
  opening: {
    title: 'Premiers duels gagnés',
    what: 'Le premier duel du round donne le first blood au gagnant et la first death au perdant. Quand il joue ce duel, le pourcentage de fois où il le gagne.',
    how: 'First bloods / (first bloods + first deaths).',
    read: "Vert dès 55 %, rouge sous 45 %. Un entry peut être sous 50 % et rester utile si l'équipe prend la revenge derrière.",
  },
  revenge_given: {
    title: 'Revenges données par round',
    what: "Ses revenges par round : il tue le tueur d'un coéquipier dans les 3 secondes.",
  },
  traded: {
    title: 'Morts avec revenge',
    what: 'Le pourcentage de ses morts où un coéquipier prend la revenge dans les 3 secondes.',
    read: "Haut : il joue près de l'équipe, sa mort sert à quelque chose. Bas : il meurt souvent seul.",
  },
  zero_dmg: {
    title: 'Morts sans dégât infligé',
    what: "Le pourcentage de ses morts sans avoir fait le moindre dégât dans le round. Plus c'est bas, mieux c'est.",
    read: 'Il se fait surprendre : pris de dos, mauvais angle, peek seul.',
  },
  multi: {
    title: 'Rounds à 2 kills ou plus',
    what: 'Le pourcentage de rounds où il fait au moins 2 kills.',
  },
  impact: {
    title: 'Impact',
    what: "Combien il fait monter ou baisser les chances de l'équipe de gagner le round, en moyenne par round.",
    how: "Avec tous nos matchs, on sait quelles chances a une équipe de gagner le round selon les joueurs en vie, le side et le spike. Chaque kill, mort ou plant fait bouger ces chances : le tueur gagne l'écart, la victime le perd.",
    example: {
      text: 'À 5v5, environ 50 % de chances de gagner le round. Après un first blood (5v4), environ 70 % : +20 pour le tueur, -20 pour la victime.',
      swing: { from: 0.5, to: 0.7 },
    },
    read: "+3 : il ajoute 3 % de chances de gagner à chaque round. Vert dès +1, rouge sous -1. Contrairement au K/D, un kill en 1v1 compte bien plus qu'un kill en 5v1.",
  },
} satisfies Record<string, StatHelp>;
