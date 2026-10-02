import { PointColumn } from './point-card.model';

/** Picture column of a point row; empty pictures keep the same box so titles line up. */
export const POINT_LEAD_CLASS = 'hidden size-10 shrink-0 place-items-center sm:grid';

/** Column of the squad's figure, shared by the rows and their list head. */
export const POINT_FIGURE_CLASS = 'sm:w-20';

/** Column of each reference, shared by the rows and their list head. */
export const POINT_REFERENCE_CLASS = 'sm:w-24';

/** Reference columns of a findings list: opponents of the same matches, then the leaderboard. */
export const FINDING_COLUMNS: PointColumn[] = [
  { label: 'Adversaire', help: 'sameLevel' },
  { label: 'Top ranked', help: 'topRanked' },
];
