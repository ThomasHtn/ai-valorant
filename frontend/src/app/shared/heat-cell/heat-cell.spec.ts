import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Rate } from '@core/common/common.model';

import { HeatCell } from './heat-cell';

@Component({
  imports: [HeatCell],
  template: `<table>
    <tr>
      <td appHeat [rate]="rate()" [center]="0.5"></td>
    </tr>
  </table>`,
})
class Host {
  public readonly rate = signal<Rate>({ count: 8, total: 10, value: 0.8 });
}

describe('HeatCell', () => {
  it('shows the percentage, green above the center, amber close to it and red below it', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const cell: HTMLElement = fixture.nativeElement.querySelector('td');
    expect(cell.textContent?.trim()).toBe('80 %');
    expect(cell.style.background).toContain('--color-rating-good');

    fixture.componentInstance.rate.set({ count: 51, total: 100, value: 0.51 });
    await fixture.whenStable();
    expect(cell.style.background).toContain('--color-rating-average');

    fixture.componentInstance.rate.set({ count: 2, total: 10, value: 0.2 });
    await fixture.whenStable();
    expect(cell.style.background).toContain('--color-rating-bad');
  });

  it('stays uncoloured below five tries', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.rate.set({ count: 3, total: 4, value: 0.75 });
    await fixture.whenStable();
    const cell: HTMLElement = fixture.nativeElement.querySelector('td');
    expect(cell.style.background).toBe('');
    expect(cell.classList).toContain('muted');
  });
});
