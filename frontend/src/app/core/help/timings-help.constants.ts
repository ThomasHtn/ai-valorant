import { StatHelp } from './stat-help.model';

/** Timings: what each statistic means, how it is counted and how to read it. */
export const TIMINGS_HELP: Readonly<Record<string, StatHelp>> = {
  timingFirstKill: {
    title: 'Temps médian du premier kill',
    what: "À quel moment du round tombe le premier kill, quelle que soit l'équipe qui le fait.",
    how: "Médiane du temps du premier kill, compté depuis la fin de la phase d'achat, sur les rounds avec au moins un kill.",
    read: 'Ni bon ni mauvais en soi: à comparer avec le top ranked pour voir le rythme du round.',
  },
  timingPlant: {
    title: 'Temps médian du plant',
    what: "À quel moment l'escouade pose le spike en attaque.",
    how: "Médiane du temps du plant, compté depuis la fin de la phase d'achat, sur les rounds d'attaque avec un plant. Vide en défense.",
  },
  timingRoundLength: {
    title: 'Durée médiane des rounds',
    what: "Combien de temps dure un round, jusqu'à la dernière action.",
    how: "Médiane du temps du dernier événement du round (kill, plant ou defuse), compté depuis la fin de la phase d'achat. L'explosion du spike et la fin du temps ne sont pas des événements: ces rounds paraissent plus courts.",
  },
  timingPlantTempo: {
    title: 'Tempo du plant',
    what: "Si l'escouade pose le spike tôt, au milieu ou tard dans le round.",
    how: "Part des plants en attaque posés avant 40 s, entre 40 et 70 s, ou après 70 s, comptés depuis la fin de la phase d'achat.",
  },
  timingPostPlantWon: {
    title: 'Post-plants gagnés',
    what: "Les rounds d'attaque gagnés selon le moment du plant.",
    how: "Rounds d'attaque gagnés avec un plant dans cette tranche de temps, divisés par les rounds d'attaque avec un plant dans cette tranche.",
  },
  timingDeaths: {
    title: 'Moment des morts',
    what: 'Si le joueur meurt tôt, au milieu ou tard dans le round.',
    how: "Morts du joueur avant 20 s, entre 20 et 60 s, ou après 60 s (depuis la fin de la phase d'achat), divisées par toutes ses morts. Référence top ranked: joueurs du même rôle.",
    read: 'Beaucoup de morts avant 20 s veut dire beaucoup de duels pris tôt, à lire avec le rôle du joueur.',
  },
  timingSurvival: {
    title: 'Joueurs encore en vie',
    what: "La part des joueurs de l'équipe encore en vie à un moment du round.",
    how: "Rounds joueur où le joueur n'est pas mort avant ce temps, divisés par tous les rounds joueur du côté. Un joueur qui finit le round en vie compte comme en vie, même si le round est déjà fini.",
    read: "Plus c'est haut, moins l'équipe perd de joueurs tôt.",
  },
  timingAfterPlant: {
    title: 'Délai entre le plant et le kill suivant',
    what: 'Combien de temps se passe entre le plant et le kill suivant.',
    how: "Médiane du temps entre le plant et le premier kill qui suit, sur les rounds avec un plant et au moins un kill après. Vos plants: rounds d'attaque; plants adverses: rounds de défense.",
    read: 'Un délai court en défense veut dire une retake rapide; en attaque, des adversaires qui arrivent vite.',
  },
};
