import { Rate } from '@core/common/common.model';

import { FindingMatch } from './findings.model';

/** Share of a rate between 0 and 1, or null without a sample. */
function share(rate: Rate | null): number | null {
  return rate && rate.total ? rate.count / rate.total : null;
}

/**
 * Matches sorted by how much each one pushed the squad's figure away from its reference: the
 * count above (or below) what the reference rate would give on that match's sample. Without a
 * squad figure (a plain count), the biggest counts come first. Ties keep the newest match first.
 */
export function rankByImpact(
  matches: FindingMatch[],
  squad: Rate | null,
  reference: Rate | null,
): FindingMatch[] {
  const squadShare = share(squad);
  // A squad figure without opponents is tested against 50 %.
  const base = squadShare === null ? 0 : (share(reference) ?? 0.5);
  const direction = squadShare === null || squadShare >= base ? 1 : -1;
  const impact = (m: FindingMatch) => direction * (m.rate.count - base * m.rate.total);
  return [...matches].sort(
    (a, b) => impact(b) - impact(a) || b.startedAt.localeCompare(a.startedAt),
  );
}
