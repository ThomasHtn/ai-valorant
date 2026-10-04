import { FindingSubject } from '@core/report/finding-subjects.model';

/** One list of the view, weaknesses or strengths: subjects costliest first. */
export interface FindingColumnView {
  subjects: FindingSubject[];
  /** Largest gap in rounds over both lists, so bars of both sides share one scale. */
  scale: number;
}
