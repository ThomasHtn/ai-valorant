import { Finding } from './findings.model';

/** A link from a finding to the view that shows its rounds, zones or player. */
export interface FindingLink {
  label: string;
  commands: string[];
  /** Added to the period already in the URL (`queryParamsHandling: 'merge'`). */
  queryParams: Record<string, string>;
}

/**
 * Every finding about one map, player or global scope. The costliest leads; the others overlap it
 * (same rounds seen by side or situation) so their rounds must not be added up.
 */
export interface FindingSubject {
  key: string;
  lead: Finding;
  others: Finding[];
}
