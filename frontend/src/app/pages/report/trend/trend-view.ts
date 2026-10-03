import { Component, computed, inject, linkedSignal, signal } from '@angular/core';

import { monthTitle } from '@core/format/format.utils';
import { formatValue } from '@core/format/value-format.utils';
import { resourceValue } from '@core/http/resource-state.utils';
import { ReportApi } from '@core/report/report-api';
import { ReportContext } from '@core/report/report-context';
import { TrendMetric, Trends } from '@core/report/trends.model';
import { InfoTip } from '@shared/info-tip/info-tip';
import { LineChart } from '@shared/line-chart/line-chart';
import { ResourceState } from '@shared/resource-state/resource-state';

import { Granularity, GRANULARITIES, SMALL_MULTIPLES, TEAM_SUBJECT } from './trend.constants';
import { TrendSparkline } from './trend-sparkline';
import {
  availableGranularities,
  metricHelp,
  metricsFor,
  periodValue,
  sparkline,
  trendMarkers,
  trendPoints,
  trendReference,
} from './trend.utils';

/**
 * Tendance: one metric over the whole history, for the squad or a player, one point per month,
 * patch or match, with its sample, patch changes, the top ranked line and the report's period
 * ringed. Rates carry their 95 % interval as a band; points with too little data are hollow. Small multiples of six squad figures by month sit under the chart.
 */
@Component({
  selector: 'app-trend-view',
  imports: [ResourceState, LineChart, InfoTip, TrendSparkline],
  templateUrl: './trend-view.html',
})
export class TrendView {
  private readonly context = inject(ReportContext);
  protected readonly trends = inject(ReportApi).trends(this.context.query);
  private readonly data = computed<Trends | null>(() => resourceValue(this.trends, null) ?? null);

  protected readonly granularities = GRANULARITIES;
  protected readonly teamSubject = TEAM_SUBJECT;

  /** 'team' or a player's name. */
  protected readonly subject = signal<string>(TEAM_SUBJECT);
  protected readonly metrics = computed<TrendMetric[]>(() => {
    const data = this.data();
    return data ? metricsFor(data, this.subject()) : [];
  });
  /** Kept when the new subject has it, otherwise the subject's first metric. */
  protected readonly metric = linkedSignal<TrendMetric[], string>({
    source: this.metrics,
    computation: (metrics, previous) =>
      previous && metrics.some((m) => m.key === previous.value)
        ? previous.value
        : (metrics[0]?.key ?? ''),
  });
  protected readonly available = computed(() =>
    availableGranularities(this.subject(), this.metric()),
  );
  /** Back to months when the new choice has no data per patch or per match. */
  protected readonly granularity = linkedSignal<Set<Granularity>, Granularity>({
    source: this.available,
    computation: (available, previous) =>
      previous && available.has(previous.value) ? previous.value : 'month',
  });

  protected readonly subjects = computed(() => [
    { key: TEAM_SUBJECT, label: "L'escouade" },
    ...(this.data()?.players.map((p) => ({ key: p.name, label: p.name })) ?? []),
  ]);
  protected readonly definition = computed(
    () => this.metrics().find((m) => m.key === this.metric()) ?? null,
  );
  protected readonly help = computed(() => {
    const definition = this.definition();
    return definition ? metricHelp(definition) : null;
  });
  protected readonly isTeam = computed(() => this.subject() === TEAM_SUBJECT);
  /** Patches the top ranked line is measured on ('13.06'), from the report header. */
  protected readonly topPatches = computed(() => {
    const meta = resourceValue(this.context.meta, null);
    return meta?.quality.topPatches.join(', ') ?? '';
  });

  protected readonly chart = computed(() => {
    const data = this.data();
    const definition = this.definition();
    if (!data || !definition) {
      return null;
    }
    const granularity = this.granularity();
    return {
      points: trendPoints(data, this.subject(), definition.key, granularity),
      markers: trendMarkers(data, granularity),
      reference: trendReference(data, this.subject(), definition.key),
      format: definition.format,
      banded: definition.format === 'pct' && granularity !== 'match',
    };
  });

  /** Six squad figures by month, the period's value written large. */
  protected readonly smallMultiples = computed(() => {
    const data = this.data();
    if (!data) {
      return [];
    }
    return SMALL_MULTIPLES.flatMap((key) => {
      const definition = data.metrics.find((m) => m.key === key);
      if (!definition) {
        return [];
      }
      const current = periodValue(data, key);
      const view = sparkline(trendPoints(data, TEAM_SUBJECT, key, 'month'), definition.top);
      return view
        ? [
            {
              key,
              label: definition.label,
              value: formatValue(current?.value ?? null, definition.format),
              month: current ? monthTitle(current.month) : '',
              view,
            },
          ]
        : [];
    });
  });

  protected setSubject(event: Event): void {
    this.subject.set((event.target as HTMLSelectElement).value);
  }

  protected setMetric(event: Event): void {
    this.metric.set((event.target as HTMLSelectElement).value);
  }

  protected setGranularity(granularity: Granularity): void {
    if (this.available().has(granularity)) {
      this.granularity.set(granularity);
    }
  }

  /** A small multiple plots that squad metric in the main chart. */
  protected showTeamMetric(key: string): void {
    this.subject.set(TEAM_SUBJECT);
    this.metric.set(key);
  }
}
