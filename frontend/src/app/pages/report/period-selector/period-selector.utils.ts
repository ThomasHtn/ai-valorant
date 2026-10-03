import { longDay, monthTitle } from '@core/format/format.utils';
import { periodOption } from '@core/report/period-query.utils';
import { ReportPeriods } from '@core/report/report-periods.model';

import { SELECTOR_SESSIONS } from './period-selector.constants';
import { PeriodOptionGroup } from './period-selector.model';

/** Options of the period selector: months, latest evenings, patches, then the whole history. */
export function periodOptionGroups(periods: ReportPeriods): PeriodOptionGroup[] {
  const sessions = periods.months.flatMap((m) => m.sessions).slice(0, SELECTOR_SESSIONS);
  return [
    {
      label: 'Mois',
      options: periods.months.map((m) => ({
        value: periodOption({ month: m.key }),
        label: monthTitle(m.key),
      })),
    },
    {
      label: 'Soirées',
      options: sessions.map((s) => ({
        value: periodOption({ start: s.day, end: s.day }),
        label: `Soirée du ${longDay(s.day).toLowerCase()}`,
      })),
    },
    {
      label: 'Patchs',
      options: periods.patches.map((p) => ({
        value: periodOption({ patch: p }),
        label: `Patch ${p}`,
      })),
    },
    {
      label: 'Historique',
      options: [
        {
          value: periodOption({ start: periods.firstDay, end: periods.lastDay }),
          label: "Tout l'historique",
        },
      ],
    },
  ];
}
