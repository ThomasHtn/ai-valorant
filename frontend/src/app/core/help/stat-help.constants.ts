import { PLAYER_HELP } from './player-help.constants';
import { READING_HELP } from './reading-help.constants';
import { StatHelp } from './stat-help.model';
import { TEAM_HELP } from './team-help.constants';

const ALL_HELP = { ...PLAYER_HELP, ...TEAM_HELP, ...READING_HELP };

export type HelpTopic = keyof typeof ALL_HELP;

/** Every explanation, looked up by the info tips. */
export const STAT_HELP: Record<HelpTopic, StatHelp> = ALL_HELP;

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

/** Explanation of each finding, by the API's `Finding.metric`; a player's own wording where it differs. */
export const FINDING_HELP: Record<string, HelpTopic> = {
  won: 'roundsWon',
  first_duel: 'teamFirstBlood',
  convert: 'convert',
  recover: 'recover',
  adv_lost: 'throws',
  post_plant: 'postPlant',
  retake: 'retake',
  no_plant: 'noPlant',
  traded: 'teamTraded',
  no_damage: 'teamNoDamage',
  opening: 'opening',
};

export const PLAYER_FINDING_HELP: Record<string, HelpTopic> = {
  ...FINDING_HELP,
  traded: 'traded',
  no_damage: 'zero_dmg',
};

/** Explanation of an API stat key, if one is written. */
export function helpFor(key: string): StatHelp | null {
  return key in STAT_HELP ? STAT_HELP[key as HelpTopic] : null;
}
