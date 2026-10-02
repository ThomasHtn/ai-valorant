import { Component, computed, inject, input, model } from '@angular/core';

import { dayMonth, percent, statValue } from '@core/format/format.utils';
import { resourceValue } from '@core/http/resource-state.utils';
import { PlayerProfile, StatGap } from '@core/periods/player.model';
import { ReferenceApi } from '@core/reference/reference-api';
import { StatDefinition } from '@core/reference/reference.model';
import { Badge } from '@shared/badge/badge';
import { DuelMap } from '@shared/duel-map/duel-map';
import { AgentIcon } from '@shared/game-art/agent-icon';
import { MapName } from '@shared/game-art/map-name';
import { DuelMapLegend } from '@shared/duel-map/duel-map-legend';
import { FormChart } from '@shared/form-chart/form-chart';
import { PointCard } from '@shared/point-card/point-card';
import { PointCardContent } from '@shared/point-card/point-card.model';
import { SegmentedTabs } from '@shared/tabs/segmented-tabs';

import { PlayerDetails } from './player-details';
import { PlayerHeadlineTiles } from './player-headline';
import { PLAYER_SECTIONS } from './player-profile.constants';
import { PlayerStatsTable } from './player-stats-table';
import { SplitTable } from './split-table';

/** Smallest top of the ACS axis, rounded up to the next hundred above the best match. */
const MIN_ACS_AXIS = 300;

/** Individual profile, one part at a time: summary, every stat, impact, breakdowns, duels. */
@Component({
  selector: 'app-player-profile',
  imports: [
    Badge,
    AgentIcon,
    MapName,
    SegmentedTabs,
    PlayerHeadlineTiles,
    PointCard,
    PlayerStatsTable,
    FormChart,
    SplitTable,
    PlayerDetails,
    DuelMap,
    DuelMapLegend,
  ],
  templateUrl: './player-profile.html',
})
export class PlayerProfileView {
  public readonly profile = input.required<PlayerProfile>();
  /** Open part, kept by the parent so it survives a change of player. */
  public readonly section = model.required<string>();

  /** The duels part only when there is something to draw. */
  protected readonly sections = computed(() =>
    PLAYER_SECTIONS.filter((s) => s.id !== 'duels' || this.profile().duelMaps.length),
  );

  private readonly glossary = inject(ReferenceApi).glossary;

  /** Statistic definitions by key, for labels and number formats. */
  protected readonly definitions = computed(
    () =>
      new Map<string, StatDefinition>(
        (resourceValue(this.glossary, null)?.stats ?? []).map((s) => [s.key, s]),
      ),
  );

  protected readonly agents = computed(() =>
    this.profile().agents.map((a) => ({ name: a.agent, share: percent(a.share) })),
  );

  protected readonly mainAgent = computed(() => this.profile().agents[0]?.agent ?? null);

  protected readonly formPoints = computed(() =>
    this.profile().form.map((m) => ({
      label: dayMonth(m.startedAt),
      value: m.acs,
      tooltip: `${dayMonth(m.startedAt)} · ${m.mapName} · ${m.agent} · ACS ${m.acs.toFixed(0)} · ${m.kills}/${m.deaths}`,
    })),
  );

  protected readonly acsAxis = computed(() =>
    Math.max(
      MIN_ACS_AXIS,
      Math.ceil(Math.max(...this.profile().form.map((m) => m.acs)) / 100) * 100,
    ),
  );

  protected readonly strengths = computed(() =>
    this.profile().strengths.map((gap) => this.gapCard(gap)),
  );
  protected readonly weaknesses = computed(() =>
    this.profile().weaknesses.map((gap) => this.gapCard(gap)),
  );

  private gapCard(gap: StatGap): PointCardContent {
    const definition = this.definitions().get(gap.key);
    const stat = this.profile().stats.find((s) => s.key === gap.key);
    return {
      badges: [],
      status: null,
      title: gap.label,
      value: statValue(definition, gap.value),
      details: [],
      references: [
        { label: 'adversaire', value: stat ? statValue(definition, stat.opponents) : null },
        { label: 'top ranked', value: stat ? statValue(definition, stat.top) : null },
      ],
      tone: gap.tone,
    };
  }
}
