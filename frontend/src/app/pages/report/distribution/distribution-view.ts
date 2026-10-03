import { Component, computed, inject, linkedSignal, signal } from '@angular/core';

import { integer } from '@core/format/value-format.utils';
import { resourceValue } from '@core/http/resource-state.utils';
import { Distribution } from '@core/report/distributions.model';
import { ReportApi } from '@core/report/report-api';
import { ReportContext } from '@core/report/report-context';
import { ReportState } from '@core/report/report-state';
import { FilterBar } from '@shared/filter-bar/filter-bar';
import { HistogramChart } from '@shared/histogram/histogram';
import { withUnit } from '@shared/histogram/histogram.utils';
import { InfoTip } from '@shared/info-tip/info-tip';
import { ResourceState } from '@shared/resource-state/resource-state';
import { StatTile } from '@shared/stat-tile/stat-tile';

import {
  DISTRIBUTION_NOTES,
  distributionHelp,
  NO_PLANT_IN_DEFENSE,
  SQUAD_SUBJECT,
} from './distribution.constants';
import { distributionSeries, medianGap, readingSentence } from './distribution.utils';

/**
 * Distribution: how a value spreads (first kill time, plant time, kill distance, damage before
 * death, ACS per match, round length), the squad against top ranked, with both medians and one
 * sentence saying what their gap means. Map and side filters narrow both cohorts.
 */
@Component({
  selector: 'app-distribution-view',
  imports: [FilterBar, ResourceState, HistogramChart, InfoTip, StatTile],
  host: { class: 'view-body' },
  templateUrl: './distribution-view.html',
})
export class DistributionView {
  private readonly context = inject(ReportContext);
  private readonly state = inject(ReportState);
  /** Map and side of the shared filter bar; the player filter does not apply here. */
  private readonly scope = computed(() => {
    const { map, side } = this.state.filters();
    return { map, side };
  });
  protected readonly distributions = inject(ReportApi).distributions(
    this.context.query,
    this.scope,
  );
  protected readonly maps = computed(() => resourceValue(this.context.meta, null)?.maps ?? []);

  private readonly all = computed(() => resourceValue(this.distributions, null) ?? []);
  /** Key of the histogram shown; the first one until the analyst picks another. */
  protected readonly selectedKey = signal<string | null>(null);
  protected readonly current = computed<Distribution | null>(() => {
    const all = this.all();
    return all.find((d) => d.key === this.selectedKey()) ?? all[0] ?? null;
  });
  /** Squad or one player; back to the squad when the histogram has no per-player split. */
  protected readonly subject = linkedSignal<Distribution | null, string>({
    source: this.current,
    computation: (current, previous) =>
      current?.players && previous ? previous.value : SQUAD_SUBJECT,
  });

  protected readonly series = computed(() => {
    const current = this.current();
    return current ? distributionSeries(current, this.subject()) : null;
  });
  protected readonly help = computed(() => {
    const current = this.current();
    return current ? distributionHelp(current.key, current.label) : null;
  });
  protected readonly note = computed(() => DISTRIBUTION_NOTES[this.current()?.key ?? ''] ?? '');
  protected readonly reading = computed(() => {
    const current = this.current();
    const series = this.series();
    return current && series ? readingSentence(current.key, series, current.unit) : null;
  });
  /** The plant histogram is empty in defense: say why instead of an empty chart. */
  protected readonly emptyReason = computed(() =>
    this.current()?.key === 'plantTime' && this.state.filters().side === 'def'
      ? NO_PLANT_IN_DEFENSE
      : null,
  );
  protected readonly squadSubject = SQUAD_SUBJECT;

  protected readonly tiles = computed(() => {
    const current = this.current();
    const series = this.series();
    if (!current || !series) {
      return null;
    }
    const median = (value: number | null): string =>
      value === null ? '—' : withUnit(value, current.unit);
    // Lines are built here, not in the template, so the tiles get stable arrays.
    return {
      squad: {
        label: `Médiane, ${series.who}`,
        value: median(series.squad.median),
        lines: [`sur ${integer(series.squad.n)}`],
      },
      top: { value: median(series.top.median), lines: [`sur ${integer(series.top.n)}`] },
      gap: {
        value: medianGap(series.squad, series.top, current.unit) ?? '—',
        lines: [`${series.who} moins top ranked`],
      },
    };
  });

  protected integer = integer;

  protected pick(key: string): void {
    this.selectedKey.set(key);
  }

  protected setSubject(event: Event): void {
    this.subject.set((event.target as HTMLSelectElement).value);
  }
}
