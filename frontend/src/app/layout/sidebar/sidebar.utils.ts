import { PERIOD_TABS } from '@core/navigation/period-nav.constants';
import { shortDay } from '@core/format/format.utils';
import { PeriodOverview } from '@core/periods/period.model';
import { SessionListItem } from '@core/sessions/session.model';

import { NavLeaf } from './sidebar.model';

/** Day and score of the latest evening, shown on the "Soirées" entry. */
export function latestSessionLeaf(sessions: SessionListItem[]): NavLeaf | null {
  const latest = sessions[0];
  if (!latest) {
    return null;
  }
  return {
    label: shortDay(latest.day),
    link: ['/sessions', latest.day],
    active: false,
    note: `${latest.wins}V-${latest.losses}D`,
    tone: latest.wins >= latest.losses ? 'good' : 'bad',
  };
}

/** Team, maps and players of the read period, each with what it holds. */
export function periodEntries(path: string, overview: PeriodOverview | null): NavLeaf[] {
  const tab = path.split('/')[2];
  return PERIOD_TABS.filter((t) => t.path !== 'glossary').map((t) => ({
    label: t.label,
    link: ['/periods', t.path],
    icon: t.icon,
    hint: periodHint(t.path, overview),
    active: path.startsWith('/periods') && tab === t.path,
  }));
}

function periodHint(path: string, overview: PeriodOverview | null): string | undefined {
  if (path === 'team') {
    return "Vue d'ensemble";
  }
  if (!overview) {
    return undefined;
  }
  if (path === 'maps') {
    const count = overview.maps.length;
    return count > 1 ? `${count} cartes jouées` : `${count} carte jouée`;
  }
  const count = overview.players.length;
  return count > 1 ? `${count} joueurs` : `${count} joueur`;
}
