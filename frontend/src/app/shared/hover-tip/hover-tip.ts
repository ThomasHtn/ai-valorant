import { Directive, DestroyRef, ElementRef, inject, input } from '@angular/core';

import { TIP_CLOSE_DELAY_MS, TIP_OPEN_DELAY_MS } from '@shared/info-tip/info-tip.constants';

import { HoverTipLayer } from './hover-tip-layer';
import { HoverTipContent } from './hover-tip.model';

/**
 * Shows a small tip while the pointer or the keyboard focus is on the host (a minimap point, a round
 * of the strip). Works on HTML and SVG elements; `null` content disables it.
 */
@Directive({
  selector: '[appHoverTip]',
  host: {
    '(pointerenter)': 'open()',
    '(pointerleave)': 'close()',
    '(focus)': 'open()',
    '(blur)': 'close()',
  },
})
export class HoverTip {
  public readonly appHoverTip = input<HoverTipContent | null>(null);

  private readonly layer = inject(HoverTipLayer);
  private readonly host = inject<ElementRef<Element>>(ElementRef);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.timer);
      this.layer.hide(this.host.nativeElement);
    });
  }

  protected open(): void {
    const content = this.appHoverTip();
    if (!content) {
      return;
    }
    clearTimeout(this.timer);
    this.timer = setTimeout(
      () => this.layer.show(this.host.nativeElement, content),
      TIP_OPEN_DELAY_MS,
    );
  }

  protected close(): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.layer.hide(this.host.nativeElement), TIP_CLOSE_DELAY_MS);
  }
}
