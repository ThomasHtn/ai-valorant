import { BadgeContent, BadgeKind } from '@core/common/badge.model';
import { RoundRef } from '@core/common/common.model';
import { FindingStatus, Side } from '@core/common/enums.model';
import { percent, roundRef } from '@core/format/format.utils';
import { SIDE_LABELS, STATUS_LABELS } from '@core/format/labels.constants';
import { KNOWN_MAPS } from '@core/game-assets/game-assets.constants';

import { Finding, RecurringSpot, RewatchGroup } from './findings.model';

/** Whose finding it is: team scopes are maps and sides, player scopes are names. */
export type FindingSubject = 'team' | 'player';

/** Scope words the API uses for a side, in findings and evolution lines. */
const SIDE_SCOPES: Record<string, BadgeKind> = {
  Attaque: 'attack',
  'En attaque': 'attack',
  Défense: 'defense',
  'En défense': 'defense',
};

const SIDE_KINDS: Record<Side, BadgeKind> = { att: 'attack', def: 'defense' };

/** Rounds to rewatch, labelled; an empty list when there is nothing to rewatch. */
export function rewatchGroups(refs: RoundRef[], who: string | null = null): RewatchGroup[] {
  return refs.length ? [{ who, rounds: refs.map(roundRef) }] : [];
}

/**
 * Badges of an API scope such as 'Split · Défense', 'Toutes cartes' or a player name. A part is a
 * player when the subject says so or when it is one of `players`, a map when the game knows it,
 * plain text otherwise.
 */
export function scopeBadges(
  scope: string | null,
  subject: FindingSubject = 'team',
  players: string[] = [],
): BadgeContent[] {
  if (!scope) {
    return [];
  }
  return scope.split(' · ').map((part) => ({
    label: part,
    kind: SIDE_SCOPES[part] ?? scopeKind(part, subject, players),
  }));
}

function scopeKind(part: string, subject: FindingSubject, players: string[]): BadgeKind {
  if (subject === 'player' || players.includes(part)) {
    return 'player';
  }
  return KNOWN_MAPS.has(part) ? 'map' : 'neutral';
}

export function sideBadge(side: Side): BadgeContent {
  return { label: SIDE_LABELS[side], kind: SIDE_KINDS[side] };
}

export function statusBadge(status: FindingStatus): BadgeContent {
  const label = STATUS_LABELS[status];
  return { label: label.charAt(0).toUpperCase() + label.slice(1), kind: status };
}

/** Scope badges of a finding: the players sharing it, or its own scope. */
export function findingBadges(finding: Finding, subject: FindingSubject): BadgeContent[] {
  if (finding.players.length) {
    return finding.players.map((p) => ({ label: p.name, kind: 'player' }));
  }
  return scopeBadges(finding.scope, subject);
}

export function findingValue(finding: Finding): string | null {
  return finding.squad ? percent(finding.squad) : null;
}

export function findingDetails(finding: Finding): (string | null)[] {
  if (finding.players.length) {
    const values = finding.players.map((p) => `${p.name} ${percent(p.rate)}`).join(', ');
    return [`${values} · adversaires ${percent(finding.reference)}`];
  }
  const versus = finding.reference ? `adversaires ${percent(finding.reference)} · ` : '';
  return [`${versus}sur ${finding.squad?.total ?? 0} ${finding.unit}`];
}

export function findingRewatch(finding: Finding): RewatchGroup[] {
  if (finding.players.length) {
    return finding.players.flatMap((p) => rewatchGroups(p.rewatch, p.name));
  }
  return rewatchGroups(finding.rewatch);
}

export function spotBadges(spot: RecurringSpot): BadgeContent[] {
  return [{ label: spot.mapName, kind: 'map' }, sideBadge(spot.side)];
}

export function spotDetails(spot: RecurringSpot): (string | null)[] {
  const who = spot.players.map((p) => `${p.name} ${p.count}`).join(', ');
  return [`${who} · revenge ${spot.revenges}/${spot.count}`];
}
