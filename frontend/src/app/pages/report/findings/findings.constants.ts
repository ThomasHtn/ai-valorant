import { FindingGroup } from '@core/report/findings.model';

/** Group headings of each column, in display order. */
export const FINDING_GROUPS: readonly { group: FindingGroup; label: string }[] = [
  { group: 'team', label: 'Équipe' },
  { group: 'players', label: 'Joueurs' },
];
