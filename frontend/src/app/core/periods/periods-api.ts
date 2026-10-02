import { httpResource, HttpResourceRef } from '@angular/common/http';
import { Service, Signal } from '@angular/core';

import { API_ENDPOINTS } from '@core/http/api-endpoints';

import { MapSheet } from './map-sheet.model';
import { AvailablePeriods, PeriodOverview, TeamReport } from './period.model';
import { PeriodQuery } from './period-query.model';
import { periodQueryParams } from './period-query.utils';
import { PlayerProfile } from './player.model';

/**
 * Data-access service for the period report. Each method returns a resource bound to reactive
 * inputs, so a change of period or tab refetches on its own.
 */
@Service()
export class PeriodsApi {
  /** Months and patches with squad matches, shared by every consumer. */
  public readonly available = httpResource<AvailablePeriods>(() => API_ENDPOINTS.periods);

  public overview(query: Signal<PeriodQuery>): HttpResourceRef<PeriodOverview | undefined> {
    return httpResource<PeriodOverview>(() => ({
      url: API_ENDPOINTS.periodOverview,
      params: periodQueryParams(query()),
    }));
  }

  public team(query: Signal<PeriodQuery>): HttpResourceRef<TeamReport | undefined> {
    return httpResource<TeamReport>(() => ({
      url: API_ENDPOINTS.periodTeam,
      params: periodQueryParams(query()),
    }));
  }

  /** Idle while `mapName` is null. */
  public map(
    query: Signal<PeriodQuery>,
    mapName: Signal<string | null>,
  ): HttpResourceRef<MapSheet | undefined> {
    return httpResource<MapSheet>(() => {
      const name = mapName();
      return name
        ? { url: API_ENDPOINTS.periodMap(name), params: periodQueryParams(query()) }
        : undefined;
    });
  }

  /** Idle while `puuid` is null. */
  public player(
    query: Signal<PeriodQuery>,
    puuid: Signal<string | null>,
  ): HttpResourceRef<PlayerProfile | undefined> {
    return httpResource<PlayerProfile>(() => {
      const id = puuid();
      return id
        ? { url: API_ENDPOINTS.periodPlayer(id), params: periodQueryParams(query()) }
        : undefined;
    });
  }
}
