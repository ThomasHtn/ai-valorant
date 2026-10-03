import { FindingSubject } from '@core/report/finding-subjects.model';
import { FindingGroup } from '@core/report/findings.model';

/** Subjects of one group (Équipe or Joueurs) inside a column, costliest first. */
export interface FindingGroupView {
  group: FindingGroup;
  label: string;
  subjects: FindingSubject[];
}

/** One column of the view: weaknesses or strengths. */
export interface FindingColumnView {
  /** Subjects shown (a map, a player...), each holding one or more findings. */
  count: number;
  groups: FindingGroupView[];
}
