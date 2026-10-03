import { MONTHS } from './labels.constants';

/** Placeholder of a missing value. */
export const EMPTY = '—';

/** '30/09' from an ISO date. */
export function dayMonth(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

/** '21:10' from an ISO date-time, in the time zone it was written in. */
export function hourMinute(iso: string): string {
  return iso.slice(11, 16);
}

/** '30/09/2026' from an ISO date. */
export function fullDate(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

const SHORT_DAY = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});
const LONG_DAY = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

/** Noon, so no timezone can move a `YYYY-MM-DD` day to its neighbour. */
function dayDate(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T12:00:00`);
}

/** 'jeu. 1 oct.' from an ISO date. */
export function shortDay(iso: string): string {
  return SHORT_DAY.format(dayDate(iso));
}

/** 'Mercredi 1 octobre' from an ISO date. */
export function longDay(iso: string): string {
  const text = LONG_DAY.format(dayDate(iso));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** 'Septembre 2026' from '2026-09'. */
export function monthTitle(month: string): string {
  const name = MONTHS[Number(month.slice(5, 7)) - 1];
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${month.slice(0, 4)}`;
}

/** '1:23' from milliseconds. */
export function clock(ms: number): string {
  const seconds = Math.round(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** '30/09 Split R14': where to find a round to rewatch. */
export function roundLabel(day: string, map: string, round: number): string {
  return `${dayMonth(day)} ${map} R${round}`;
}

/**
 * '02/10 à 10:53' from an ISO date-time ('2026-10-02T10:53:33+02:00'), read in the time it was
 * written in; any other text is returned as is.
 */
export function freshness(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  return match ? `${match[3]}/${match[2]} à ${match[4]}:${match[5]}` : value;
}
