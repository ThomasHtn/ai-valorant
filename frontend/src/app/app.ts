import { Component } from '@angular/core';

import { Shell } from '@layout/shell/shell';

/** Root component: the application frame. */
@Component({
  selector: 'app-root',
  imports: [Shell],
  template: '<app-shell />',
})
export class App {}
