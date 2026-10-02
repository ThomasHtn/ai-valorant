import { DOCUMENT } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import { HelpTopic, STAT_HELP } from '@core/help/stat-help.constants';
import { StatHelp } from '@core/help/stat-help.model';

import { placeTip } from './info-tip-position.utils';
import { TIP_CLOSE_DELAY_MS, TIP_OPEN_DELAY_MS } from './info-tip.constants';
import { SwingGauge } from './swing-gauge';

let nextId = 0;
/** Only one tip is open at a time across the page. */
let openTip: InfoTip | null = null;

/**
 * "i" icon that explains a statistic. Opens on hover or keyboard focus, stays open on click or
 * tap until Escape or a click elsewhere. The tip is a popover, so scrolling tables never clip it.
 */
@Component({
  selector: 'app-info-tip',
  imports: [SwingGauge],
  templateUrl: './info-tip.html',
  styleUrl: './info-tip.css',
})
export class InfoTip {
  /** Explanation from the shared catalogue... */
  public readonly topic = input<HelpTopic | null>(null);
  /** ...or given directly, for stats whose key comes from the API. */
  public readonly content = input<StatHelp | null>(null);

  protected readonly entry = computed(() => {
    const topic = this.topic();
    return this.content() ?? (topic ? STAT_HELP[topic] : null);
  });
  protected readonly id = `info-tip-${nextId++}`;
  protected readonly isOpen = signal(false);

  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly document = inject(DOCUMENT);
  /** Opened by a click or a tap: hover and blur no longer close it. */
  private pinned = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private stopListening: (() => void) | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.close());
  }

  protected onPointerEnter(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      this.schedule(() => this.show(), TIP_OPEN_DELAY_MS);
    }
  }

  protected onPointerLeave(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && !this.pinned) {
      this.schedule(() => this.close(), TIP_CLOSE_DELAY_MS);
    }
  }

  protected onPanelEnter(): void {
    clearTimeout(this.timer);
  }

  /** Keyboard focus only; a mouse click focuses the button too but is handled by `toggle`. */
  protected onFocus(): void {
    if (this.trigger()?.nativeElement.matches(':focus-visible')) {
      this.show();
    }
  }

  protected onBlur(): void {
    if (!this.pinned) {
      this.close();
    }
  }

  protected toggle(): void {
    if (this.pinned) {
      this.close();
      return;
    }
    this.pinned = true;
    this.show();
  }

  private show(): void {
    clearTimeout(this.timer);
    const panel = this.panel()?.nativeElement;
    if (this.isOpen() || !panel) {
      return;
    }
    if (openTip && openTip !== this) {
      openTip.close();
    }
    openTip = this;
    panel.showPopover();
    this.isOpen.set(true);
    this.position();
    this.listen();
  }

  private close(): void {
    clearTimeout(this.timer);
    this.pinned = false;
    if (!this.isOpen()) {
      return;
    }
    this.panel()?.nativeElement.hidePopover();
    this.isOpen.set(false);
    this.stopListening?.();
    this.stopListening = null;
    if (openTip === this) {
      openTip = null;
    }
  }

  private schedule(action: () => void, delay: number): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(action, delay);
  }

  private position(): void {
    const trigger = this.trigger()?.nativeElement;
    const panel = this.panel()?.nativeElement;
    if (!trigger || !panel) {
      return;
    }
    const placement = placeTip(
      trigger.getBoundingClientRect(),
      { width: panel.offsetWidth, height: panel.offsetHeight },
      {
        width: this.document.documentElement.clientWidth,
        height: this.document.documentElement.clientHeight,
      },
    );
    panel.style.top = `${placement.top}px`;
    panel.style.left = `${placement.left}px`;
  }

  /** Escape, a click outside, scroll and resize; only while the tip is open. */
  private listen(): void {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        const hadFocus = this.document.activeElement === this.trigger()?.nativeElement;
        this.close();
        if (hadFocus) {
          this.trigger()?.nativeElement.focus();
        }
      }
    };
    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target as Node;
      const inside =
        this.trigger()?.nativeElement.contains(target) ||
        this.panel()?.nativeElement.contains(target);
      if (!inside) {
        this.close();
      }
    };
    const onMove = (): void => this.position();
    const view = this.document.defaultView ?? window;
    this.document.addEventListener('keydown', onKey);
    this.document.addEventListener('pointerdown', onPointerDown);
    view.addEventListener('scroll', onMove, { capture: true, passive: true });
    view.addEventListener('resize', onMove);
    this.stopListening = () => {
      this.document.removeEventListener('keydown', onKey);
      this.document.removeEventListener('pointerdown', onPointerDown);
      view.removeEventListener('scroll', onMove, { capture: true });
      view.removeEventListener('resize', onMove);
    };
  }
}
