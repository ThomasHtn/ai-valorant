import { Component, computed, input } from '@angular/core';

import { decimal, fraction, percentOf } from '@core/format/format.utils';
import { BadgeKind } from '@core/common/badge.model';
import { sideBadge } from '@core/periods/finding-format.utils';
import { SessionMatch, SessionPoint } from '@core/sessions/session.model';
import { Badge } from '@shared/badge/badge';
import { AgentIcon } from '@shared/game-art/agent-icon';
import { PointCard } from '@shared/point-card/point-card';
import { PointCardContent } from '@shared/point-card/point-card.model';
import { InfoTip } from '@shared/info-tip/info-tip';
import { RatingAgainstClassPipe, RatingClassPipe } from '@shared/rating/rating-class.pipe';

import { CostlyRoundCard } from '../costly-round/costly-round';

/** One match of the evening: score, scoreboard, recurring and unusual points, costly rounds. */
@Component({
  selector: 'app-session-match',
  imports: [
    Badge,
    AgentIcon,
    RatingClassPipe,
    RatingAgainstClassPipe,
    InfoTip,
    PointCard,
    CostlyRoundCard,
  ],
  templateUrl: './session-match.html',
})
export class SessionMatchView {
  public readonly match = input.required<SessionMatch>();

  protected readonly result = computed(() => {
    const m = this.match();
    return m.roundsWon > m.roundsLost ? 'Victoire' : m.roundsWon < m.roundsLost ? 'Défaite' : 'Nul';
  });

  protected readonly resultKind = computed<BadgeKind>(() => {
    const m = this.match();
    return m.roundsWon > m.roundsLost ? 'good' : m.roundsWon < m.roundsLost ? 'bad' : 'neutral';
  });

  protected readonly recurring = computed(() => this.match().recurring.map(pointCard));
  protected readonly unusual = computed(() => this.match().unusual.map(pointCard));

  protected readonly decimal = decimal;
  protected readonly percentOf = percentOf;
  protected readonly fraction = fraction;
}

function pointCard(point: SessionPoint): PointCardContent {
  return {
    badges: [sideBadge(point.side)],
    status: null,
    title: point.title,
    value: null,
    details: [point.detail],
    tone: point.tone,
  };
}
