import { groupBySubject } from '@core/report/finding-subjects.utils';
import { Finding, FindingSide } from '@core/report/findings.model';
import { ReportFilters } from '@core/report/report-preferences.model';

import { FINDING_GROUPS } from './findings.constants';
import { FindingColumnView } from './findings.model';

/**
 * Keeps the findings matching the scope filters: a finding on another map, side or player is
 * dropped, one that names none of them stays. `confirmedOnly` keeps net gaps.
 */
export function filterFindings(
  findings: Finding[],
  filters: ReportFilters,
  confirmedOnly: boolean,
): Finding[] {
  return findings.filter((f) => {
    if (confirmedOnly && f.status !== 'confirmed') {
      return false;
    }
    if (filters.map && f.mapName && f.mapName !== filters.map) {
      return false;
    }
    if (filters.side && f.scopeSide && f.scopeSide !== filters.side) {
      return false;
    }
    return !(filters.player && f.player && f.player !== filters.player);
  });
}

/** One column (weaknesses or strengths): subjects by group, the costliest in rounds first. */
export function findingColumn(findings: Finding[], side: FindingSide): FindingColumnView {
  const ofSide = findings.filter((f) => f.side === side);
  const groups = FINDING_GROUPS.map(({ group, label }) => ({
    group,
    label,
    subjects: groupBySubject(ofSide.filter((f) => f.group === group)),
  })).filter((g) => g.subjects.length > 0);
  return { count: groups.reduce((n, g) => n + g.subjects.length, 0), groups };
}

/** Width of a rate bar in percent; at least 1 so an empty bar is still visible. */
export function barWidth(value: number | null): number {
  return Math.max(1, Math.min(100, (value ?? 0) * 100));
}
