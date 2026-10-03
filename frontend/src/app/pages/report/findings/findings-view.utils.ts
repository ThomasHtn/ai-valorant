import { SIDE_LABELS } from '@core/format/labels.constants';
import { Finding, FindingSide } from '@core/report/findings.model';
import { ReportFilters } from '@core/report/report-preferences.model';

import { FINDING_GROUPS } from './findings.constants';
import { FindingColumnView } from './findings.model';

/**
 * Keeps the findings matching the scope filters, as the mockup does: a finding naming another map
 * than the chosen one is dropped (one naming no map stays); a player filter only applies to player
 * findings; a side filter only to findings naming a side. `confirmedOnly` keeps net gaps.
 */
export function filterFindings(
  findings: Finding[],
  filters: ReportFilters,
  maps: string[],
  confirmedOnly: boolean,
): Finding[] {
  const sides = Object.values(SIDE_LABELS).map((s) => s.toLowerCase());
  return findings.filter((f) => {
    if (confirmedOnly && f.status !== 'confirmed') {
      return false;
    }
    const text = `${f.scope} ${f.metric}`.toLowerCase();
    if (
      filters.map &&
      !text.includes(filters.map.toLowerCase()) &&
      maps.some((m) => text.includes(m.toLowerCase()))
    ) {
      return false;
    }
    if (filters.player && f.group === 'players' && !text.includes(filters.player.toLowerCase())) {
      return false;
    }
    if (
      filters.side &&
      sides.some((s) => text.includes(s)) &&
      !text.includes(SIDE_LABELS[filters.side].toLowerCase())
    ) {
      return false;
    }
    return true;
  });
}

/** One column (weaknesses or strengths): findings by group, the costliest in rounds first. */
export function findingColumn(findings: Finding[], side: FindingSide): FindingColumnView {
  const ofSide = findings
    .filter((f) => f.side === side)
    .sort((a, b) => Math.abs(b.gapRounds) - Math.abs(a.gapRounds));
  return {
    count: ofSide.length,
    groups: FINDING_GROUPS.map(({ group, label }) => ({
      group,
      label,
      findings: ofSide.filter((f) => f.group === group),
    })).filter((g) => g.findings.length > 0),
  };
}

/** Width of a rate bar in percent; at least 1 so an empty bar is still visible. */
export function barWidth(value: number | null): number {
  return Math.max(1, Math.min(100, (value ?? 0) * 100));
}
