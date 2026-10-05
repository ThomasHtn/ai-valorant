import { RosterLine } from '@core/report/squad.model';

import { acsTip, openingDuels } from './roster-board.utils';

const line = (openingRecord: string) => ({ name: 'Alpha', openingRecord }) as RosterLine;

describe('openingDuels', () => {
  it('writes first bloods over first deaths, coloured by who wins more', () => {
    expect(openingDuels(line('105-84'))).toMatchObject({ text: '105 / 84', tone: 'good' });
    expect(openingDuels(line('31-36'))).toMatchObject({ tone: 'bad' });
    expect(openingDuels(line('41-41'))).toMatchObject({ tone: 'flat' });
    expect(openingDuels(line('3-2'))).toMatchObject({ tone: 'thin' });
  });
});

describe('acsTip', () => {
  it('lists every month of the chart, then the top ranked', () => {
    const tip = acsTip(
      { name: 'Alpha', acsMonths: [231, null], acs: { v: 231, top: 215 } } as RosterLine,
      ['Août', 'Septembre'],
    );
    expect(tip.lines).toEqual([
      { label: 'Août', value: '231' },
      { label: 'Septembre', value: 'Pas joué' },
      { label: 'Top ranked', value: '215' },
    ]);
  });
});
