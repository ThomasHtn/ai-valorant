import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { formatGap, formatValue } from '@core/format/value-format.utils';
import { monthTitle } from '@core/format/format.utils';
import { resourceValue } from '@core/http/resource-state.utils';
import { PeriodQuery } from '@core/report/period-query.model';
import { ReportApi } from '@core/report/report-api';
import { ReportContext } from '@core/report/report-context';
import { roundLink } from '@core/report/round-ref.utils';
import { Badge } from '@shared/badge/badge';
import { AgentIcon } from '@shared/game-art/agent-icon';
import { MapThumb } from '@shared/game-art/map-thumb';
import { ResourceState } from '@shared/resource-state/resource-state';
import { StatTile } from '@shared/stat-tile/stat-tile';

import { roundsByMatch } from '../matches/matches.utils';
import { matchRowView } from '../matches/match-row/match-row.utils';
import { debriefTiles, playerForms, turningRounds } from './debrief.utils';
import { MatchCard } from './match-card/match-card';

/**
 * Débrief of one session: its headline figures beside the month's, its matches as cards, each
 * player against his own month (best ACS first), and the lost rounds the squad had in hand.
 */
@Component({
  selector: 'app-debrief-view',
  imports: [AgentIcon, Badge, MapThumb, MatchCard, ResourceState, RouterLink, StatTile],
  templateUrl: './debrief-view.html',
  host: { class: 'view-body' },
})
export class DebriefView {
  private readonly context = inject(ReportContext);
  private readonly api = inject(ReportApi);

  /** Month the session belongs to: the yardstick of every figure. */
  private readonly monthKey = computed(() => (this.context.query().start ?? '').slice(0, 7));
  private readonly monthQuery = computed<PeriodQuery>(() => ({ month: this.monthKey() }));
  protected readonly monthName = computed(() =>
    this.monthKey() ? monthTitle(this.monthKey()).split(' ')[0] : 'Mois',
  );

  protected readonly list = this.api.matches(this.context.query);
  private readonly rounds = this.api.rounds(this.context.query);
  private readonly monthList = this.api.matches(this.monthQuery);
  private readonly monthRounds = this.api.rounds(this.monthQuery);

  private readonly sessionRounds = computed(() => resourceValue(this.rounds, null)?.rounds ?? []);
  protected readonly tiles = computed(() =>
    debriefTiles(
      this.sessionRounds(),
      resourceValue(this.monthRounds, null)?.rounds ?? [],
      this.monthName(),
    ),
  );
  protected readonly cards = computed(() => {
    const byMatch = roundsByMatch(this.sessionRounds());
    return (resourceValue(this.list, null)?.evenings ?? [])
      .flatMap((e) => e.matches)
      .map((m) => matchRowView(m, byMatch.get(m.matchId) ?? []));
  });
  protected readonly players = computed(() =>
    playerForms(
      resourceValue(this.list, null)?.evenings ?? [],
      resourceValue(this.monthList, null)?.evenings ?? [],
    ),
  );
  protected readonly turning = computed(() =>
    turningRounds(this.sessionRounds()).map((r) => ({ ...r, link: roundLink(r) })),
  );

  protected readonly acs = (value: number) => formatValue(value, 'int');
  protected readonly kd = (value: number) => formatValue(value, 'dec2');
  protected readonly acsGap = (gap: number) => formatGap(gap, 'int');
  protected readonly kdGap = (gap: number) => formatGap(gap, 'dec2');
}
