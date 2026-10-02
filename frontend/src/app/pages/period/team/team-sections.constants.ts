import {
  LucideCoins,
  LucideCrosshair,
  LucideGauge,
  LucideIcon,
  LucideScale,
  LucideTarget,
  LucideUsers,
} from '@lucide/angular';

import { HelpTopic } from '@core/help/stat-help.constants';
import { TeamGroupId } from '@core/navigation/period-nav.model';

/** Icon of each part in the team tab's sub-navigation. */
export const TEAM_GROUP_ICONS: Record<TeamGroupId, LucideIcon> = {
  summary: LucideGauge,
  findings: LucideScale,
  rounds: LucideTarget,
  economy: LucideCoins,
  duels: LucideCrosshair,
  group: LucideUsers,
};

/** Sections of the team tab, in display order inside their part (`group`); the summary has its own layout. */
export const TEAM_SECTIONS: readonly {
  id: string;
  group: TeamGroupId;
  title: string;
  help?: HelpTopic;
}[] = [
  { id: 'weak', group: 'findings', title: 'À travailler', help: 'status' },
  { id: 'strong', group: 'findings', title: 'Points forts', help: 'status' },
  { id: 'evolution', group: 'findings', title: 'Évolution', help: 'points' },
  { id: 'situations', group: 'rounds', title: 'Situations numériques', help: 'situation' },
  { id: 'economy', group: 'economy', title: 'Économie' },
  { id: 'opening', group: 'duels', title: 'Premiers duels' },
  { id: 'spots', group: 'duels', title: 'Spots de first death' },
  { id: 'sites', group: 'duels', title: 'Plants et retakes' },
  { id: 'roster', group: 'group', title: 'Joueurs' },
  { id: 'revenge', group: 'group', title: 'Qui venge qui', help: 'teamTraded' },
  { id: 'compositions', group: 'group', title: 'Compositions' },
  { id: 'context', group: 'group', title: 'Moment de la session' },
];
