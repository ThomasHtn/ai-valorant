import { Component } from '@angular/core';

/** Key of the duel map colours. */
@Component({
  selector: 'app-duel-map-legend',
  template: `
    <span class="mr-3"
      ><i class="mr-1 inline-block size-2.5 rounded-full bg-success"></i>first blood (position du
      tueur)</span
    >
    <span
      ><i class="mr-1 inline-block size-2.5 rounded-full bg-danger"></i>first death (position de la
      victime)</span
    >
  `,
  host: { class: 'caption block' },
})
export class DuelMapLegend {}
