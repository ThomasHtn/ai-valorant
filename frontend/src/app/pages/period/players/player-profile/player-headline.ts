import { Component, input } from '@angular/core';

import { Tone } from '@core/common/enums.model';
import { decimal, statValue } from '@core/format/format.utils';
import { HeadlineValue, PlayerHeadline } from '@core/periods/player.model';
import { RatedStat } from '@core/rating/rating.constants';
import { Rating } from '@core/rating/rating.model';
import { rateAgainst, rateStat } from '@core/rating/rating.utils';
import { StatDefinition } from '@core/reference/reference.model';
import { StatTile } from '@shared/stat-tile/stat-tile';
import { STAT_BAND_FLUSH_CLASS } from '@shared/stat-tile/stat-tile.constants';

/** Headline figures of a player, at the foot of the player card, with the change against the comparison period. */
@Component({
  selector: 'app-player-headline',
  imports: [StatTile],
  template: `
    @let h = headline();
    <app-stat-tile
      label="ACS"
      help="acs"
      [value]="format('acs', h.acs.value)"
      [rating]="rate('acs', h.acs.value)"
      [detail]="change('acs', h.acs)"
      [tone]="tone('acs', h.acs)"
    />
    <app-stat-tile label="K/D" help="kd" [value]="decimal(h.kd, 2)" [rating]="rate('kd', h.kd)" />
    <app-stat-tile
      label="ADR"
      help="adr"
      [value]="format('adr', h.adr.value)"
      [rating]="rate('adr', h.adr.value)"
      [detail]="change('adr', h.adr)"
      [tone]="tone('adr', h.adr)"
    />
    <app-stat-tile
      label="KAST"
      help="kast"
      [value]="format('kast', h.kast.value)"
      [rating]="rate('kast', h.kast.value)"
      [detail]="change('kast', h.kast)"
      [tone]="tone('kast', h.kast)"
    />
    <app-stat-tile
      label="Headshots"
      help="hs"
      [value]="format('hs', h.headshots.value)"
      [rating]="rate('hs', h.headshots.value)"
      [detail]="change('hs', h.headshots)"
      [tone]="tone('hs', h.headshots)"
    />
    <app-stat-tile
      label="First bloods - deaths"
      help="fbfd"
      [value]="h.firstBloods + '-' + h.firstDeaths"
      [rating]="duelRating(h.firstBloods, h.firstDeaths)"
    />
    <app-stat-tile
      label="Impact"
      help="impact"
      [value]="format('impact', h.impact.value)"
      [rating]="rate('impact', h.impact.value)"
      [detail]="change('impact', h.impact)"
      [tone]="tone('impact', h.impact)"
    />
  `,
  host: { class: STAT_BAND_FLUSH_CLASS },
})
export class PlayerHeadlineTiles {
  public readonly headline = input.required<PlayerHeadline>();
  public readonly definitions = input.required<Map<string, StatDefinition>>();

  protected readonly decimal = decimal;

  protected rate(stat: RatedStat, value: number | null): Rating {
    return rateStat(stat, value);
  }

  /** More first bloods than first deaths is good, fewer is bad. */
  protected duelRating(firstBloods: number, firstDeaths: number): Rating {
    return rateAgainst(firstBloods, firstDeaths, { band: 0 });
  }

  protected format(key: string, value: number | null): string {
    return statValue(this.definitions().get(key), value);
  }

  /** '+12', '-3 pts' for rates, '+1.4' for the impact; the comparison is named above the tiles. */
  protected change(key: string, stat: HeadlineValue): string | null {
    if (stat.value === null || stat.previous === null) {
      return null;
    }
    const delta = stat.value - stat.previous;
    const definition = this.definitions().get(key);
    const text =
      definition?.kind === 'rate'
        ? `${decimal(100 * delta, 0, true)} pts`
        : decimal(delta, key === 'impact' ? 1 : 0, true);
    return text;
  }

  protected tone(key: string, stat: HeadlineValue): Tone {
    if (stat.value === null || stat.previous === null || stat.value === stat.previous) {
      return 'neutral';
    }
    const better = this.definitions().get(key)?.higherIsBetter ?? true;
    return stat.value > stat.previous === better ? 'good' : 'bad';
  }
}
