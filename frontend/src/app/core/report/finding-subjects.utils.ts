import { LossCause } from '@core/common/enums.model';
import { LOSS_CAUSE_LABELS } from '@core/format/labels.constants';
import { formatValue } from '@core/format/value-format.utils';

import { FindingLink, FindingSubject } from './finding-subjects.model';
import { Finding } from './findings.model';

/** Kinds measured against opponents where a coordinated 5-stack is naturally ahead of solo queues. */
const FIVE_STACK_KINDS = new Set(['revenge', 'isolated']);
/** Round type findings overlap ('Full buy' holds 'Full buy contre eco'): one subject for all. */
const ROUND_TYPE_KIND = 'roundType';
const ROUND_TYPES_SUBJECT = 'Types de round';
/** Between the parts of a scope: 'Global · 5v4', 'Split · défense'. */
const SCOPE_SEPARATOR = ' · ';
/** Kinds the tables write per round ('0,14'), not as a share ('14 %'): the finding writes them the same way. */
const PER_ROUND_KINDS = new Set(['firstBlood', 'firstDeath']);
/** Causes listed under a weakness. */
const MAX_CAUSES = 3;

/**
 * What a finding is about: a player, else a map, else the round types together ('Full buy' holds
 * 'Full buy contre eco'), else the first part of its scope ('Global · 5v4' is about 'Global').
 */
export function subjectKey(f: Finding): string {
  if (f.player) {
    return `player:${f.player}`;
  }
  if (f.mapName) {
    return `map:${f.mapName}`;
  }
  return `scope:${subjectLabel(f)}`;
}

/** Name of the subject as the card title writes it. */
export function subjectLabel(f: Finding): string {
  if (f.player || f.mapName) {
    return (f.player ?? f.mapName) as string;
  }
  return f.kind === ROUND_TYPE_KIND ? ROUND_TYPES_SUBJECT : f.scope.split(SCOPE_SEPARATOR)[0];
}

/** Findings grouped by subject, in the order of their costliest finding (input sorted by size). */
export function groupBySubject(findings: readonly Finding[]): FindingSubject[] {
  const sorted = [...findings].sort((a, b) => Math.abs(b.gapRounds) - Math.abs(a.gapRounds));
  const subjects = new Map<string, FindingSubject>();
  for (const f of sorted) {
    const key = subjectKey(f);
    const subject = subjects.get(key);
    if (subject) {
      subject.others.push(f);
    } else {
      subjects.set(key, { key, lead: f, others: [] });
    }
  }
  return [...subjects.values()];
}

/** What the finding measures inside its subject: 'Défense, rounds gagnés', or the metric alone. */
export function detailLabel(f: Finding): string {
  const subject = subjectLabel(f);
  const prefix = `${subject} · `;
  if (f.scope.startsWith(prefix)) {
    const rest = f.scope.slice(prefix.length);
    return `${rest.charAt(0).toUpperCase()}${rest.slice(1)}, ${lowerFirst(f.metric)}`;
  }
  return f.scope === subject ? f.metric : `${f.scope}, ${lowerFirst(f.metric)}`;
}

/** '40 % contre 50 % au top ranked': the squad against the reference the test used. */
export function referenceText(f: Finding): string {
  const reference = f.reference === 'opp' ? f.opp : f.top;
  const name = f.reference === 'opp' ? 'chez les adversaires' : 'au top ranked';
  const format = rateFormat(f);
  return `${formatValue(f.squad.value, format)} contre ${formatValue(reference.value, format)} ${name}`;
}

/** How a finding's rates are written, the same way as in the tables. */
function rateFormat(f: Finding): 'pct' | 'dec2' {
  return PER_ROUND_KINDS.has(f.kind) ? 'dec2' : 'pct';
}

/** Rate the finding was tested against, and how the text names it. */
function testedReference(f: Finding): { rate: Finding['top']; name: string } {
  return f.reference === 'opp'
    ? { rate: f.opp, name: 'les adversaires' }
    : { rate: f.top, name: 'le top ranked' };
}

/** Whether the squad rate sits at or above the rate it was tested against. */
function squadAbove(f: Finding): boolean {
  return (f.squad.value ?? 0) >= (testedReference(f).rate.value ?? 0);
}

/** Whether a higher squad rate is the better one: a strength above its reference, a weakness below. */
export function higherIsBetter(f: Finding): boolean {
  return f.side === 'strong' ? squadAbove(f) : !squadAbove(f);
}

/** 'morts sans dégâts' from 'Morts sans dégâts'; acronyms ('ACS') stay as written. */
function lowerFirst(text: string): string {
  return /^[A-ZÀ-Ý][a-zà-ÿ]/.test(text) ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}

/**
 * Why the finding is good or bad: 'Moins de morts sans dégâts que le top ranked', and which way the
 * metric is better (1 higher, -1 lower) for the "Plus bas = mieux" hint beside it.
 */
export function verdictText(f: Finding): { comparison: string; better: 1 | -1 } {
  const reference = testedReference(f);
  const more = squadAbove(f);
  return {
    comparison: `${more ? 'Plus' : 'Moins'} de ${lowerFirst(f.metric)} que ${reference.name}`,
    better: higherIsBetter(f) ? 1 : -1,
  };
}

/** 'Retake raté (3 rounds), duels perdus (2 rounds)': the main causes of the lost rounds behind a weakness. */
export function mainCauses(f: Finding): string | null {
  const causes = (Object.entries(f.lostCauses) as [LossCause, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_CAUSES);
  if (!causes.length) {
    return null;
  }
  return causes
    .map(([cause, count], i) => {
      const label = LOSS_CAUSE_LABELS[cause];
      return `${i ? label.toLowerCase() : label} (${count} round${count > 1 ? 's' : ''})`;
    })
    .join(', ');
}

/** Warns when a strength against opponents may only be the 5-stack edge over solo queues. */
export function fiveStackCaveat(f: Finding): string | null {
  if (f.side !== 'strong' || f.reference !== 'opp' || !FIVE_STACK_KINDS.has(f.kind)) {
    return null;
  }
  return (
    `Un 5-stack part avantagé ici face à des solo queues. Face au top ranked : ` +
    `${formatValue(f.squad.value, 'pct')} contre ${formatValue(f.top.value, 'pct')}.`
  );
}

/** Views that show what is behind a finding: its rounds, its zones on the map, the player sheet. */
export function findingLinks(f: Finding): FindingLink[] {
  const scope: Record<string, string> = {};
  if (f.mapName) {
    scope['map'] = f.mapName;
  }
  if (f.scopeSide) {
    scope['side'] = f.scopeSide;
  }
  if (f.player) {
    scope['player'] = f.player;
  }
  const weak = f.side === 'weak';
  const links: FindingLink[] = [];
  // A global finding would open every round of the period: no link.
  if (Object.keys(scope).length) {
    links.push({
      label: weak ? 'Rounds perdus' : 'Rounds gagnés',
      commands: ['/report/rounds'],
      queryParams: { ...scope, result: weak ? 'lost' : 'won' },
    });
  }
  if (f.mapName) {
    const { map: _map, ...rest } = scope;
    links.push({ label: 'Minimap', commands: ['/report/minimap', f.mapName], queryParams: rest });
  }
  if (f.player) {
    links.push({ label: 'Fiche joueur', commands: ['/report/players', f.player], queryParams: {} });
  }
  return links;
}
