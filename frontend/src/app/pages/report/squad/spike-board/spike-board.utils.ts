import { formatValue } from '@core/format/value-format.utils';
import { byCost, gapRate } from '@core/report/gap.utils';
import { Situation, SiteLine } from '@core/report/squad.model';

import { dashTone, roundsPill } from '../dash.utils';
import { SITES, STRONG_ROUNDS } from '../squad.constants';
import { SiteMapLine, SpikeHead } from '../squad.model';
import { gapTip } from '../tips.utils';

/** The big ring of the card: the situation over every map. */
export function spikeHead(situation: Situation): SpikeHead {
  const { gap } = situation;
  return {
    share: gapRate(gap),
    value: gapRate(gap) === null ? '–' : String(Math.round((gapRate(gap) ?? 0) * 100)),
    tone: dashTone(gap),
    mark: gap.top,
    sub: `${gap.k} gagnés sur ${gap.n}, top ranked ${formatValue(gap.top, 'pct')}`,
    rounds: roundsPill(gap),
  };
}

/** One line per map, the costliest first: a painted cell per site, then the whole map. */
export function siteMapLines(situation: Situation, sites: readonly SiteLine[]): SiteMapLine[] {
  return byCost(
    situation.maps.filter((m) => m.gap.n),
    (m) => m.gap,
  ).map((m) => ({
    map: m.mapName,
    sites: SITES.map((letter) => {
      const site = sites.find((s) => s.mapName === m.mapName && s.site === letter);
      if (!site) {
        return null;
      }
      const tone = dashTone(site.gap);
      return {
        rounds: roundsPill(site.gap).text,
        tone,
        tip: gapTip(`${m.mapName}, site ${letter}`, site.gap),
        strong:
          (tone === 'good' || tone === 'bad') && Math.abs(site.gap.rounds ?? 0) >= STRONG_ROUNDS,
      };
    }),
    rounds: roundsPill(m.gap),
    tip: gapTip(`${m.mapName}, carte entière`, m.gap),
  }));
}
