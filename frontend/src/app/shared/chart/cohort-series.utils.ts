import { Rate } from '@core/common/common.model';
import { Cohort } from '@core/common/enums.model';
import { fraction } from '@core/format/format.utils';
import { COHORT_LABELS } from '@core/format/labels.constants';

import { resolveSeriesColor } from './chart-theme.utils';
import { ChartGroupSeries } from './chart.model';

/** Fixed palette slot of each cohort, so the squad keeps the same colour on every chart. */
const COHORT_SLOT: Record<Cohort, number> = { squad: 0, opp: 1, top: 2 };

/** One grouped-bar series per cohort, from its rates (plotted in %). */
export function cohortSeries(cohort: Cohort, rates: Rate[], withCounts = true): ChartGroupSeries {
  return {
    label: COHORT_LABELS[cohort],
    color: resolveSeriesColor(COHORT_SLOT[cohort]),
    values: rates.map((rate) => (rate.total ? (100 * rate.count) / rate.total : null)),
    details: withCounts ? rates.map((rate) => fraction(rate)) : undefined,
  };
}
