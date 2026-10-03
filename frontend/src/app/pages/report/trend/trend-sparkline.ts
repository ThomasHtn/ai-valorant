import { Component, input } from '@angular/core';

import { SparklineView } from './trend.utils';

/** Small multiple of a squad metric by month: the line, the top ranked dashes, the period in amber. */
@Component({
  selector: 'app-trend-sparkline',
  template: `
    <svg
      class="block h-13 w-full"
      [attr.viewBox]="'0 0 ' + view().width + ' ' + view().height"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      @if (view().referenceY !== null) {
        <line
          x1="0"
          [attr.x2]="view().width"
          [attr.y1]="view().referenceY"
          [attr.y2]="view().referenceY"
          stroke="var(--color-top)"
          stroke-dasharray="4 4"
        />
      }
      <polyline
        [attr.points]="view().line"
        fill="none"
        stroke="var(--color-squad)"
        stroke-width="2"
      />
      @for (dot of view().dots; track $index) {
        <circle
          [attr.cx]="dot.x"
          [attr.cy]="dot.y"
          [attr.r]="dot.highlighted ? 3.5 : 2.2"
          [attr.fill]="
            dot.small
              ? 'var(--color-text-muted)'
              : dot.highlighted
                ? 'var(--color-brand-500)'
                : 'var(--color-squad)'
          "
        />
      }
    </svg>
  `,
  host: { class: 'block' },
})
export class TrendSparkline {
  public readonly view = input.required<SparklineView>();
}
