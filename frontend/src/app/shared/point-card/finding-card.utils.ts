import { LucideLayers } from '@lucide/angular';

import { percent } from '@core/format/format.utils';
import { ALL_MAPS_SCOPE } from '@core/format/labels.constants';
import { FINDING_HELP, PLAYER_FINDING_HELP } from '@core/help/stat-help.constants';
import {
  FindingSubject,
  findingDetails,
  findingReferences,
  rewatchGroups,
  scopeBadges,
  statusBadge,
  usualWay,
} from '@core/periods/finding-format.utils';
import { Finding, SummaryItem } from '@core/periods/findings.model';
import { PlayerLink } from '@core/periods/period.model';

import { PointCardContent } from './point-card.model';

type ScopeParts = Pick<PointCardContent, 'badges' | 'place' | 'agent' | 'icon'>;

/**
 * Where a point happens, as a row draws it: a map's preview, a player's main agent then their
 * name, or an icon for every map. Sides stay as badges. `known` is a scope the page already gives.
 */
function scopeParts(
  scope: string,
  subject: FindingSubject,
  players: PlayerLink[],
  known: string | null,
): ScopeParts {
  const badges = scopeBadges(
    scope,
    subject,
    players.map((p) => p.name),
  ).filter((b) => b.label !== known);
  const player = badges.find((b) => b.kind === 'player');
  const hasMap = badges.some((b) => b.kind === 'map');
  const rest = badges.filter((b) => b.kind !== 'player' && b.label !== ALL_MAPS_SCOPE);
  if (player) {
    const link = players.find((p) => p.name === player.label);
    return { badges: rest, place: player.label, agent: link?.mainAgent ?? null, icon: null };
  }
  if (hasMap || known) {
    return { badges: rest, place: null, agent: null, icon: null };
  }
  return { badges: rest, place: ALL_MAPS_SCOPE, agent: null, icon: LucideLayers };
}

/** A finding as a row of a findings list. */
export function findingCard(
  finding: Finding,
  subject: FindingSubject,
  players: PlayerLink[] = [],
  known: string | null = null,
): PointCardContent {
  return {
    ...scopeParts(finding.scope, subject, players, known),
    status: statusBadge(finding.status),
    title: finding.label,
    value: percent(finding.squad),
    details: findingDetails({ ...finding, squad: usualWay(finding.squad, finding.inverted) }),
    references: findingReferences(finding),
    rewatch: rewatchGroups(finding.rewatch),
    tone: finding.tone,
    // Explanations describe the stat the usual way round, which an inverted line contradicts.
    help: finding.inverted
      ? null
      : ((subject === 'player' ? PLAYER_FINDING_HELP : FINDING_HELP)[finding.metric] ?? null),
    matches: finding.matches,
    unit: finding.unit,
  };
}

/** A line of "À retenir"; the first-death spot is a count, so it has no figure to compare. */
export function summaryCard(item: SummaryItem, players: PlayerLink[]): PointCardContent {
  const parts = scopeParts(item.scope, 'team', players, null);
  // A map row has no place and an every-map row has an icon: what is left is a player.
  const forPlayer = parts.place !== null && parts.icon === null;
  return {
    ...parts,
    status: null,
    title: item.label,
    value: item.squad ? percent(item.squad) : null,
    details:
      item.squad && item.metric
        ? findingDetails({
            metric: item.metric,
            unit: item.unit,
            squad: usualWay(item.squad, item.inverted),
          })
        : [],
    references: item.squad
      ? findingReferences(item)
      : [
          { label: 'adversaire', value: null },
          { label: 'top ranked', value: null },
        ],
    tone: item.tone,
    // Explanations describe the stat the usual way round, which an inverted line contradicts.
    help:
      item.metric && !item.inverted
        ? ((forPlayer ? PLAYER_FINDING_HELP : FINDING_HELP)[item.metric] ?? null)
        : null,
    matches: item.matches,
    unit: item.unit,
  };
}
