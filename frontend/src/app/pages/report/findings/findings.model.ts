import { Finding, FindingGroup } from '@core/report/findings.model';

/** Findings of one group (Équipe or Joueurs) inside a column, costliest first. */
export interface FindingGroupView {
  group: FindingGroup;
  label: string;
  findings: Finding[];
}

/** One column of the view: weaknesses or strengths. */
export interface FindingColumnView {
  count: number;
  groups: FindingGroupView[];
}
