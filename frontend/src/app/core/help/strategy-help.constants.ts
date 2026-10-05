import { StatHelp } from './stat-help.model';

/** Stratégie: compositions, agent picks, habits and plants of the top ranked on one map. */
export const STRATEGY_HELP: Readonly<Record<string, StatHelp>> = {
  compShare: {
    title: 'Part des matchs',
    what: 'Part des équipes top ranked qui jouent cette compo exacte sur la carte.',
  },
  agentShare: {
    title: 'Agents par rôle',
    what: "Part des équipes top ranked qui jouent l'agent sur la carte, toutes compos confondues.",
  },
  habitCost: {
    title: 'Coût estimé',
    what: "Rounds par match que l'escouade gagne (+) ou perd (−) en ayant cette habitude plus ou moins souvent que le top ranked.",
    how: '(part escouade − part top ranked) × (rounds gagnés avec − sans, chez le top ranked) × situations par match',
    read: 'Une estimation pour classer les habitudes, pas une promesse : les habitudes se recoupent.',
  },
  plantSites: {
    title: 'Poses par site',
    what: 'Part des spikes posés sur chaque site, puis rounds gagnés une fois le spike posé là.',
  },
  defenseContacts: {
    title: 'Premier contact en défense',
    what: 'Zone où se trouve le défenseur au premier duel du round, et part des premiers duels gagnés par la défense dans cette zone.',
  },
};
