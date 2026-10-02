import { BadgeContent, BadgeKind } from '@core/common/badge.model';
import { Rate, RoundRef } from '@core/common/common.model';
import { PointReference } from '@core/common/point-reference.model';
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
  return { label: STATUS_LABELS[status], kind: status };
}

/** Sample size; a first duel says how it split, in the game's words. */
export function findingDetails(finding: Pick<Finding, 'metric' | 'unit' | 'squad'>): string[] {
  const { count, total } = finding.squad;
  if (finding.metric === 'opening') {
    return [`${count} first bloods, ${total - count} first deaths`];
  }
  return [`sur ${total} ${finding.unit}`];
}

/**
 * Opponents of the same level, then the leaderboard. A rate tested against 50 % (rounds won, first
 * bloods) shows 50 % as its same-level reference: what an even match gives. The leaderboard is at
 * 50 % too when nothing splits it: a first duel, or a won/lost share over both sides.
 */
export function findingReferences(finding: {
  scope: string | null;
  metric: string | null;
  reference: Rate | null;
  top: Rate | null;
}): PointReference[] {
  const sided = (finding.scope ?? '').split(' · ').some((part) => part in SIDE_SCOPES);
  const evenTop = finding.metric === 'opening' || (!finding.reference && !sided);
  return [
    { label: 'adversaire', value: finding.reference ? percent(finding.reference) : '50 %' },
    { label: 'top ranked', value: finding.top ? percent(finding.top) : evenTop ? '50 %' : null },
  ];
}

export function spotBadges(spot: RecurringSpot): BadgeContent[] {
  return [{ label: spot.mapName, kind: 'map' }, sideBadge(spot.side)];
}

export function spotDetails(spot: RecurringSpot): (string | null)[] {
  const who = spot.players.map((p) => `${p.name} ${p.count}`).join(', ');
  return [who, `vengées ${spot.revenges} fois sur ${spot.count}`];
}

/** The squad rate counting successes again, so details name the split in the game's words. */
export function usualWay(squad: Rate, inverted: boolean): Rate {
  if (!inverted) {
    return squad;
  }
  const count = squad.total - squad.count;
  return { count, total: squad.total, value: squad.total ? count / squad.total : null };
}
