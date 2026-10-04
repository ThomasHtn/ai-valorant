import { groupBySubject } from '@core/report/finding-subjects.utils';
import { Finding, FindingSide } from '@core/report/findings.model';

import { FindingColumnView } from './findings.model';

/** Largest gap in rounds of the period, the length of a full bar. */
export function gapScale(findings: readonly Finding[]): number {
  return Math.max(1, ...findings.map((f) => Math.abs(f.gapRounds)));
}

/** One list (weaknesses or strengths): team and players mixed, the costliest subject first. */
export function findingColumn(findings: readonly Finding[], side: FindingSide): FindingColumnView {
  return {
    subjects: groupBySubject(findings.filter((f) => f.side === side)),
    scale: gapScale(findings),
  };
}

/** Width of a rate bar in percent; at least 1 so an empty bar is still visible. */
export function barWidth(value: number | null): number {
  return Math.max(1, Math.min(100, (value ?? 0) * 100));
}

/** Card a link asks to open ('weak:map:Split'), split into its side and subject key. */
export function openTarget(param: string | null | undefined): {
  side: FindingSide | null;
  key: string | null;
} {
  const at = param?.indexOf(':') ?? -1;
  const side = at > 0 ? param!.slice(0, at) : '';
  return side === 'weak' || side === 'strong'
    ? { side, key: param!.slice(at + 1) || null }
    : { side: null, key: null };
}
