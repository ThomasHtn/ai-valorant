import { Component } from '@angular/core';

/** Header of the two win-loss columns of a table, placed where a `<th>` is expected. */
@Component({
  selector: 'app-win-loss-header',
  template: `
    <th scope="col" [class]="cellClass">V</th>
    <th scope="col" [class]="cellClass">D</th>
  `,
  host: { class: 'contents' },
})
export class WinLossHeader {
  protected readonly cellClass =
    'bg-text-primary/8 px-2.5 py-2 text-right align-middle text-sm font-semibold whitespace-nowrap text-text-secondary';
}
