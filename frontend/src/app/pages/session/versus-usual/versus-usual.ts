import { Component, input } from '@angular/core';

import { decimal, percentOf } from '@core/format/format.utils';
import { HeadlineValue } from '@core/periods/player.model';
import { VersusUsualRow } from '@core/sessions/session.model';
import { InfoTip } from '@shared/info-tip/info-tip';

type Kind = 'integer' | 'rate' | 'impact';

/** Each player's evening against their own average on the other matches. */
@Component({
  selector: 'app-versus-usual',
  imports: [InfoTip],
  templateUrl: './versus-usual.html',
  host: { class: 'table-scroll block' },
})
export class VersusUsual {
  public readonly rows = input.required<VersusUsualRow[]>();

  protected readonly columns: {
    key: 'acs' | 'adr' | 'kast' | 'impact';
    label: string;
    kind: Kind;
  }[] = [
    { key: 'acs', label: 'ACS', kind: 'integer' },
    { key: 'adr', label: 'ADR', kind: 'integer' },
    { key: 'kast', label: 'KAST', kind: 'rate' },
    { key: 'impact', label: 'Impact', kind: 'impact' },
  ];

  protected value(stat: HeadlineValue, kind: Kind): string {
    return kind === 'rate'
      ? percentOf(stat.value)
      : decimal(stat.value, kind === 'impact' ? 1 : 0, kind === 'impact');
  }

  /** Change against the usual level; '=' when it rounds to zero. */
  protected delta(stat: HeadlineValue, kind: Kind): string {
    if (stat.value === null || stat.previous === null) {
      return '-';
    }
    const gap = stat.value - stat.previous;
    const text =
      kind === 'rate'
        ? `${decimal(100 * gap, 0, true)} pts`
        : decimal(gap, kind === 'impact' ? 1 : 0, true);
    return /^[+-]?0(\.0)?( pts)?$/.test(text) ? '=' : text;
  }

  protected better(stat: HeadlineValue): boolean {
    return stat.value !== null && stat.previous !== null && stat.value > stat.previous;
  }
}
