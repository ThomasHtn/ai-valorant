import { Rate, RoundRef } from '@core/common/common.model';
import { StatDefinition } from '@core/reference/reference.model';

import { MONTHS } from './labels.constants';

/** Placeholder of a missing value. */
export const EMPTY = '-';

/** '48 %' from a rate, '-' without tries. */
export function percent(rate: Rate | null | undefined): string {
  return rate && rate.total ? `${Math.round((100 * rate.count) / rate.total)} %` : EMPTY;
}

/** '48 %' from a share between 0 and 1. */
export function percentOf(value: number | null | undefined): string {
  return value === null || value === undefined ? EMPTY : `${Math.round(100 * value)} %`;
}

/** '21/54'. */
export function fraction(rate: Rate): string {
  return `${rate.count}/${rate.total}`;
}

/** Fixed decimals, optionally with an explicit sign ('+1.2'). */
export function decimal(value: number | null | undefined, digits = 0, signed = false): string {
  if (value === null || value === undefined) {
    return EMPTY;
  }
  const text = value.toFixed(digits);
  return signed && value >= 0 ? `+${text}` : text;
}

/** A statistic formatted with its own definition: percent for rates, decimals for means. */
export function statValue(
  definition: StatDefinition | undefined,
  value: number | null | undefined,
): string {
  if (!definition) {
    return decimal(value, 2);
  }
  return definition.kind === 'rate'
    ? percentOf(value)
    : decimal(value, definition.decimals, definition.signed);
}

/** Change in points between two rates: '+3 pts', '-2 pts' or '='; null without a previous rate. */
export function pointsChange(current: Rate, previous: Rate | null): number | null {
  if (!previous || !previous.total || !current.total) {
    return null;
  }
  return Math.round(100 * (current.count / current.total - previous.count / previous.total));
}

export function signedPoints(points: number): string {
  return points === 0 ? '=' : `${points > 0 ? '+' : ''}${points} pts`;
}

/** '30/09' from an ISO date. */
export function dayMonth(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
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

/** 'mer. 1 oct.' from an ISO date. */
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
export function roundRef(ref: RoundRef): string {
  return `${dayMonth(ref.startedAt)} ${ref.mapName} R${ref.roundNumber}`;
}
