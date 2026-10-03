import { StatHelp } from './stat-help.model';

/** Agents et compos: what each statistic means, how it is counted and how to read it. */
export const AGENTS_HELP: Readonly<Record<string, StatHelp>> = {
  agentsPlayed: {
    title: 'Agents joués',
    what: "Les agents joués par l'escouade sur la période et ce qu'ils rapportent.",
    how: "Un match compte pour un agent dès qu'un joueur de l'escouade le joue. Référence top ranked : les équipes qui jouent cet agent.",
  },
  agentRoundsWon: {
    title: "Rounds gagnés avec l'agent",
    what: "La part des rounds gagnés quand l'agent est dans l'équipe.",
    how: 'Rounds gagnés / rounds joués avec cet agent. Référence top ranked : mêmes rounds pour les équipes qui jouent cet agent.',
    read: "Autour de 50 % en top ranked ; au-dessus, l'agent réussit à l'escouade.",
  },
  agentPool: {
    title: 'Agent pool par joueur',
    what: 'Ce que chaque joueur produit sur chacun de ses agents.',
    how: 'Rounds joués par le joueur avec cet agent. Référence top ranked : tous les joueurs de cet agent.',
  },
  fbfd: {
    title: 'FB-FD',
    what: 'Le nombre de first bloods faits et de first deaths subies.',
    how: 'First blood = premier kill du round ; first death = première mort du round.',
  },
  openingWon: {
    title: 'Premiers duels gagnés',
    what: 'La part des premiers duels que le joueur gagne quand il est impliqué.',
    how: 'First bloods / (first bloods + first deaths).',
    read: "Au-dessus de 50 %, le joueur gagne plus d'ouvertures qu'il n'en perd.",
  },
  compos: {
    title: 'Compos par carte',
    what: "Les compos de 5 agents jouées par l'escouade sur chaque carte.",
    how: 'Rounds gagnés / rounds joués avec la compo exacte. Référence top ranked : équipes avec la même compo sur la même carte (souvent peu ou pas de matchs).',
  },
  compoRoundsWon: {
    title: 'Rounds gagnés avec la compo',
    what: 'La part des rounds gagnés avec cette compo sur cette carte.',
    how: 'Rounds gagnés / rounds joués, sur les matchs joués avec ces 5 agents.',
  },
  topCompo: {
    title: 'Compo la plus jouée en top ranked',
    what: 'La compo de 5 agents la plus fréquente en top ranked sur chaque carte.',
    how: 'Part des équipes = équipes top ranked avec cette compo / toutes les équipes top ranked sur la carte. Rounds gagnés = rounds gagnés / rounds joués par ces équipes.',
  },
  roleSplit: {
    title: 'Rôles par compo',
    what: 'La répartition des rôles dans la compo : duellistes, initiateurs, contrôleurs, sentinelles.',
    how: "Format D-I-C-S : nombre de duellistes, initiateurs, contrôleurs et sentinelles. On compare la répartition la plus jouée par l'escouade à la plus jouée en top ranked sur la carte.",
  },
  oppAgents: {
    title: 'Agents adverses',
    what: "Comment l'escouade s'en sort selon les agents joués en face.",
    how: "Un match compte dès que l'agent est dans l'équipe adverse.",
  },
  oppAgentRoundsWon: {
    title: "Rounds gagnés contre l'agent",
    what: "La part des rounds gagnés par l'escouade quand cet agent est en face.",
    how: "Rounds gagnés / rounds joués contre une équipe qui a cet agent. Référence : l'escouade avant la période.",
  },
  oppAgentKpr: {
    title: "Kills de l'agent par round",
    what: "Combien de joueurs de l'escouade cet agent adverse tue par round.",
    how: "Kills de l'agent sur l'escouade / rounds joués contre lui. Référence top ranked : kills par round de cet agent en top ranked.",
    read: "Plus c'est bas, mieux l'escouade contient cet agent.",
  },
  topPresence: {
    title: 'Présence des agents en top ranked',
    what: "Les 5 agents les plus joués en top ranked sur chaque carte, et combien l'escouade en joue.",
    how: "Taux de présence = équipes top ranked avec l'agent / toutes les équipes top ranked sur la carte. Joués par l'escouade = agents de ce top 5 joués au moins une fois par l'escouade sur la carte dans la période.",
  },
};
