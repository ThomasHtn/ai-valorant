import { Rate } from '@core/common/common.model';
import { SiteRow } from '@core/periods/team.model';

import { postPlantLines, retakeLines } from './site-lines.utils';

function rate(count: number, total: number): Rate {
  return { count, total, value: total ? count / total : null };
}

const ROW: SiteRow = {
  mapName: 'Sunset',
  site: 'B',
  plantShare: rate(17, 30),
  topPlantShare: rate(50, 100),
  postPlant: { squad: rate(8, 11), reference: rate(75, 100) },
  plantsAgainstShare: rate(16, 32),
  retake: { squad: rate(0, 16), reference: rate(29, 100) },
};

describe('site lines', () => {
  it('says how often each site comes beside its post-plants and retakes', () => {
    const [attack] = postPlantLines([ROW]);
    expect(attack.label).toBe('Sunset B');
    expect(attack.detail).toBe('57 % de vos plants, top ranked 50 %');
    expect(retakeLines([ROW])[0].detail).toBe('50 % des plants adverses');
    expect(retakeLines([ROW])[0].squad.total).toBe(16);
  });
});
