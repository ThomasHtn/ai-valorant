import { StatHelp } from './stat-help.model';

/** Combat: what each statistic means, how it is counted and how to read it. */
export const COMBAT_HELP: Readonly<Record<string, StatHelp>> = {
  acs: {
    title: 'ACS',
    what: 'Score de combat moyen par round, tel que calculé par le jeu.',
    how: 'Somme du score de combat du jeu divisée par les rounds joués.',
    read: 'Autour de 200 en moyenne ; dépend fortement du rôle.',
  },
  kd: {
    title: 'K/D',
    what: 'Kills par mort.',
    how: 'Kills sur des adversaires divisés par les morts.',
    read: "Au-dessus de 1, le joueur tue plus qu'il ne meurt.",
  },
  killsPerRound: {
    title: 'Kills par round',
    what: 'Nombre moyen de kills par round.',
    how: 'Kills sur des adversaires divisés par les rounds joués.',
  },
  deathsPerRound: {
    title: 'Morts par round',
    what: 'Fréquence à laquelle le joueur meurt.',
    how: 'Morts divisées par les rounds joués.',
    read: 'Plus bas est meilleur.',
  },
  assistsPerRound: {
    title: 'Assists par round',
    what: "Nombre moyen d'assists par round.",
    how: "Kills de l'équipe où le joueur est crédité d'une assist, divisés par les rounds joués.",
  },
  adr: {
    title: 'ADR',
    what: 'Dégâts infligés en moyenne par round.',
    how: 'Somme des dégâts infligés aux adversaires divisée par les rounds joués.',
  },
  damageTakenPerRound: {
    title: 'Dégâts subis par round',
    what: 'Dégâts reçus en moyenne par round.',
    how: 'Somme des dégâts reçus des adversaires divisée par les rounds joués.',
    read: "Plus bas est meilleur ; un rôle d'entrée en subit naturellement plus.",
  },
  damageEfficiency: {
    title: 'Efficacité des dégâts',
    what: 'Dégâts infligés pour chaque point de dégât reçu.',
    how: 'Dégâts infligés divisés par dégâts reçus.',
    read: "Au-dessus de 1, le joueur gagne l'échange de dégâts.",
  },
  kast: {
    title: 'KAST',
    what: 'Part des rounds où le joueur a été utile.',
    how: "Rounds avec au moins un kill, une assist, une survie ou une mort suivie d'une revenge (3 s), divisés par les rounds joués.",
    read: '70 % ou plus est un bon niveau.',
  },
  headshotRate: {
    title: 'HS %',
    what: 'Part des balles touchées qui touchent la tête.',
    how: 'Tirs à la tête divisés par (tête + corps + jambes) parmi les tirs qui touchent.',
  },
  headshotTakenRate: {
    title: 'HS subis %',
    what: 'Part des balles reçues qui touchent la tête du joueur.',
    how: 'Tirs reçus à la tête divisés par tous les tirs reçus qui touchent.',
    read: 'Plus bas est meilleur : une valeur haute signale un placement de viseur adverse facile (angles prévisibles, peeks larges).',
  },
  zeroDamageDeaths: {
    title: 'Morts à 0 dégât',
    what: "Part des morts où le joueur n'a infligé aucun dégât dans le round.",
    how: 'Rounds où le joueur meurt avec 0 dégât infligé, divisés par ses morts.',
    read: 'Plus bas est meilleur : ce sont des morts sans contrepartie.',
  },
  survival: {
    title: 'Survie',
    what: 'Part des rounds où le joueur est vivant à la fin.',
    how: 'Rounds sans mort du joueur divisés par les rounds joués.',
  },
  killsOutnumbered: {
    title: 'Kills en infériorité',
    what: "Kills faits quand l'équipe a moins de joueurs vivants.",
    how: "Kills où l'équipe du tueur compte moins de vivants que l'adversaire juste avant le kill, divisés par les rounds joués.",
  },
  multiKillRate: {
    title: 'Multi-kills',
    what: 'Part des rounds où le joueur fait au moins 2 kills.',
    how: 'Rounds avec 2 kills ou plus divisés par les rounds joués.',
  },
  acsRegularity: {
    title: 'Régularité',
    what: "Écart de l'ACS d'un match à l'autre.",
    how: "Écart type de l'ACS par match (3 matchs minimum). Référence top ranked : médiane des écarts types des joueurs du même rôle avec 5 matchs ou plus.",
    read: 'Plus bas est meilleur : le joueur produit le même niveau chaque match.',
  },
  multiKills: {
    title: 'Multi-kills',
    what: 'Nombre de rounds terminés avec 2, 3, 4 ou 5 kills.',
    how: 'Rounds où le joueur fait exactement ce nombre de kills sur des adversaires. 5 kills = ace.',
  },
  multiKillSpeed: {
    title: 'Vitesse des multi-kills',
    what: "Temps entre le premier et le dernier kill d'un multi-kill.",
    how: 'Médiane, sur les rounds à 2 kills ou plus, du temps entre le premier et le dernier kill du joueur, en secondes.',
    read: 'Valeur descriptive : court signifie des kills enchaînés dans le même duel.',
  },
  killValue: {
    title: 'Valeur des kills',
    what: "Sur quel type d'achat adverse le joueur fait ses kills.",
    how: "Kills hors pistols répartis selon l'achat de l'équipe de la victime : eco (équipement moyen < 1 500 crédits), force buy (1 500 à 3 699), full buy (3 700 et plus).",
    read: 'Les kills sur full buy pèsent le plus ; une part haute sur eco gonfle les stats sans gagner de rounds difficiles.',
  },
  faceToFace: {
    title: 'Face-à-face',
    what: 'Les 3 adversaires que le joueur a le plus affrontés sur la période.',
    how: 'Adversaires classés par nombre de kills et de morts entre eux ; la valeur affiche kills - morts du joueur contre cet adversaire.',
    read: 'Les adversaires changent à chaque match ranked : valeur indicative.',
  },
};
