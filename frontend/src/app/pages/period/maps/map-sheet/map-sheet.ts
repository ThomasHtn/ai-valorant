import { Component, computed, input, model } from '@angular/core';

import { percent } from '@core/format/format.utils';
import { mapSplash } from '@core/game-assets/game-assets.utils';
import { rewatchGroups } from '@core/periods/finding-format.utils';
import { MAP_KPI_HELP } from '@core/help/stat-help.constants';
import { MapKpi, MapSheet } from '@core/periods/map-sheet.model';
import { Rating } from '@core/rating/rating.model';
import { rateAgainst } from '@core/rating/rating.utils';
import { Badge } from '@shared/badge/badge';
import { FindingList } from '@shared/point-card/finding-list';
import { PointCard } from '@shared/point-card/point-card';
import { StatTile } from '@shared/stat-tile/stat-tile';
import { STAT_BAND_FLUSH_CLASS } from '@shared/stat-tile/stat-tile.constants';
import { SegmentedTabs } from '@shared/tabs/segmented-tabs';

import { MapSideView } from '../map-side/map-side';
import { MapCompositionsView } from './map-compositions';
import { MAP_SECTIONS } from './map-sheet.constants';
import { MapPlayers } from './map-players';

/** One map: a hero with its headline figures, then one part at a time, against top ranked games. */
@Component({
  selector: 'app-map-sheet',
  imports: [
    Badge,
    SegmentedTabs,
    StatTile,
    FindingList,
    PointCard,
    MapSideView,
    MapCompositionsView,
    MapPlayers,
  ],
  templateUrl: './map-sheet.html',
})
export class MapSheetView {
  public readonly sheet = input.required<MapSheet>();
  /** Open part, kept by the parent so it survives a change of map. */
  public readonly section = model.required<string>();

  protected readonly sections = computed(() => {
    const sides = new Set<string>(this.sheet().sides.map((s) => s.side));
    return MAP_SECTIONS.filter((s) => (s.id === 'att' || s.id === 'def' ? sides.has(s.id) : true));
  });

  protected readonly percent = percent;
  protected readonly kpiHelp = MAP_KPI_HELP;
  protected readonly bandClass = STAT_BAND_FLUSH_CLASS;

  /** Against top ranked games on the same map; not judged without them. */
  protected kpiRating(kpi: MapKpi): Rating {
    return kpi.squad.total && kpi.top?.total
      ? rateAgainst(kpi.squad.value, kpi.top.value)
      : 'unknown';
  }

  protected readonly splash = computed(() => mapSplash(this.sheet().mapName));

  protected readonly throwRewatch = computed(() => rewatchGroups(this.sheet().throwRewatch));
}
