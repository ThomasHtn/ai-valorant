import { PLAYER_HELP } from './player-help.constants';
import { READING_HELP } from './reading-help.constants';
import { StatHelp, StatHelpGroup } from './stat-help.model';
import { TEAM_HELP } from './team-help.constants';

const ALL_HELP = { ...PLAYER_HELP, ...TEAM_HELP, ...READING_HELP };

export type HelpTopic = keyof typeof ALL_HELP;

/** Every explanation, looked up by the info tips. */
export const STAT_HELP: Record<HelpTopic, StatHelp> = ALL_HELP;

/** Same explanations grouped for the glossary tab. */
export const STAT_HELP_GROUPS: StatHelpGroup[] = [
  { title: 'Lire le rapport', entries: READING_HELP },
  { title: 'Stats individuelles', entries: PLAYER_HELP },
  { title: "Stats d'équipe", entries: TEAM_HELP },
];

/** Explanation of each map sheet tile, by the API's `MapKpi.key`. */
export const MAP_KPI_HELP: Record<string, HelpTopic> = {
  rounds: 'roundsWon',
  attack: 'sideRounds',
  defense: 'sideRounds',
  pistols: 'pistols',
  first_blood: 'teamFirstBlood',
  post_plant: 'postPlant',
  retake: 'retake',
};

/** Explanation of an API stat key, if one is written. */
export function helpFor(key: string): StatHelp | null {
  return key in STAT_HELP ? STAT_HELP[key as HelpTopic] : null;
}
