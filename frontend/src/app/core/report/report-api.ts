import { httpResource, HttpResourceRef } from '@angular/common/http';
import { Service, Signal } from '@angular/core';

import { API_ENDPOINTS } from '@core/http/api-endpoints';

import { PeriodQuery } from './period-query.model';
import { periodQueryParams } from './period-query.utils';
import { MatchDetail, MatchList } from './matches.model';
import { MinimapView } from './minimap.model';
import { ReportMeta } from './report-meta.model';
import { ReportPeriods } from './report-periods.model';
import { RoundIndex, RoundRef, RoundSheet } from './rounds.model';
import { DomainTables } from './stat-table.model';
import { Distribution, DistributionScope } from './distributions.model';
import { PlayerSheet, PlayerSummary } from './players.model';
import { Trends } from './trends.model';
import { Detections } from './detections.model';
import { FindingsReport } from './findings.model';

/**
 * Data-access service of the report. Each method returns a resource bound to reactive inputs, so a
 * change of period or domain refetches on its own.
 */
@Service()
export class ReportApi {
  /** The report tree (months, sessions, patches), for the period switcher and the form strip. */
  public readonly periods = httpResource<ReportPeriods>(() => API_ENDPOINTS.reportPeriods);

  public meta(query: Signal<PeriodQuery>): HttpResourceRef<ReportMeta | undefined> {
    return httpResource<ReportMeta>(() => ({
      url: API_ENDPOINTS.reportMeta,
      params: periodQueryParams(query()),
    }));
  }

  /** Idle while `domain` is null. */
  public tables(
    query: Signal<PeriodQuery>,
    domain: Signal<string | null>,
  ): HttpResourceRef<DomainTables | undefined> {
    return httpResource<DomainTables>(() => {
      const key = domain();
      return key
        ? { url: API_ENDPOINTS.reportTables(key), params: periodQueryParams(query()) }
        : undefined;
    });
  }

  // --- Matches, rounds and minimap views ---

  /** Matches of the period grouped by evening. */
  public matches(query: Signal<PeriodQuery>): HttpResourceRef<MatchList | undefined> {
    return httpResource<MatchList>(() => ({
      url: API_ENDPOINTS.reportMatches,
      params: periodQueryParams(query()),
    }));
  }

  /** One match; idle while `matchId` is null. */
  public match(matchId: Signal<string | null>): HttpResourceRef<MatchDetail | undefined> {
    return httpResource<MatchDetail>(() => {
      const id = matchId();
      return id ? API_ENDPOINTS.reportMatch(id) : undefined;
    });
  }

  /** Every squad round of the period. */
  public rounds(query: Signal<PeriodQuery>): HttpResourceRef<RoundIndex | undefined> {
    return httpResource<RoundIndex>(() => ({
      url: API_ENDPOINTS.reportRounds,
      params: periodQueryParams(query()),
    }));
  }

  /** Sheet of one round; idle while `round` is null. */
  public roundSheet(round: Signal<RoundRef | null>): HttpResourceRef<RoundSheet | undefined> {
    return httpResource<RoundSheet>(() => {
      const ref = round();
      return ref ? API_ENDPOINTS.reportRound(ref.matchId, ref.roundNumber) : undefined;
    });
  }

  /** Positions of the period on one map; idle while `map` is null. */
  public minimap(
    query: Signal<PeriodQuery>,
    map: Signal<string | null>,
  ): HttpResourceRef<MinimapView | undefined> {
    return httpResource<MinimapView>(() => {
      const name = map();
      return name
        ? { url: API_ENDPOINTS.reportMinimap(name), params: periodQueryParams(query()) }
        : undefined;
    });
  }

  // --- Findings and detections views ---

  /** Strengths and weaknesses of the period. */
  public findings(query: Signal<PeriodQuery>): HttpResourceRef<FindingsReport | undefined> {
    return httpResource<FindingsReport>(() => ({
      url: API_ENDPOINTS.reportFindings,
      params: periodQueryParams(query()),
    }));
  }

  /** What the period repeats, its biggest gaps and the links between figures. */
  public detections(query: Signal<PeriodQuery>): HttpResourceRef<Detections | undefined> {
    return httpResource<Detections>(() => ({
      url: API_ENDPOINTS.reportDetections,
      params: periodQueryParams(query()),
    }));
  }

  // --- Players, trend and distribution views ---

  /** Squad players of the period, for the player picker. */
  public players(query: Signal<PeriodQuery>): HttpResourceRef<PlayerSummary[] | undefined> {
    return httpResource<PlayerSummary[]>(() => ({
      url: API_ENDPOINTS.reportPlayers,
      params: periodQueryParams(query()),
    }));
  }

  /** Sheet of one squad player; idle while `name` is null. */
  public player(
    query: Signal<PeriodQuery>,
    name: Signal<string | null>,
  ): HttpResourceRef<PlayerSheet | undefined> {
    return httpResource<PlayerSheet>(() => {
      const player = name();
      return player
        ? { url: API_ENDPOINTS.reportPlayer(player), params: periodQueryParams(query()) }
        : undefined;
    });
  }

  /** Squad and player figures over the whole history; the period marks the highlighted points. */
  public trends(query: Signal<PeriodQuery>): HttpResourceRef<Trends | undefined> {
    return httpResource<Trends>(() => ({
      url: API_ENDPOINTS.reportTrends,
      params: periodQueryParams(query()),
    }));
  }

  /** Histograms of the period against top ranked, narrowed to one map and one side when given. */
  public distributions(
    query: Signal<PeriodQuery>,
    scope: Signal<DistributionScope>,
  ): HttpResourceRef<Distribution[] | undefined> {
    return httpResource<Distribution[]>(() => {
      const { map, side } = scope();
      return {
        url: API_ENDPOINTS.reportDistributions,
        params: {
          ...periodQueryParams(query()),
          ...(map ? { map } : {}),
          ...(side ? { side } : {}),
        },
      };
    });
  }
}
