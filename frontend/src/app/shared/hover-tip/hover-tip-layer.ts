import { DOCUMENT } from '@angular/common';
import { inject, Service } from '@angular/core';

import { placeTip } from '@shared/info-tip/info-tip-position.utils';

import { HoverTipContent } from './hover-tip.model';

/** Classes of the tip panel: the info tip's look (sunken ground, amber left rule, square). */
const PANEL_CLASS =
  'fixed m-0 w-max max-w-[min(25rem,calc(100vw-16px))] border-0 border-l-2 border-brand-500/50 bg-surface-sunken px-4 py-3 text-left text-[0.95rem] font-normal text-text-primary';
const TITLE_CLASS = 'm-0 mb-1 font-display text-[1.05rem] font-semibold text-brand-400 uppercase';
const LABEL_CLASS = 'py-0.5 pr-3 text-text-secondary';
const VALUE_CLASS = 'py-0.5 text-right font-semibold';

/**
 * The single tip panel shared by every `appHoverTip` of the page: one popover in the body, filled
 * with text nodes (never HTML) and placed next to the hovered element.
 */
@Service()
export class HoverTipLayer {
  private readonly document = inject(DOCUMENT);
  private panel: HTMLElement | null = null;
  private owner: Element | null = null;

  /** Shows `content` next to `anchor`; replaces any tip already open. */
  public show(anchor: Element, content: HoverTipContent): void {
    const panel = this.ensurePanel();
    panel.replaceChildren(...this.render(content));
    this.owner = anchor;
    if (!panel.matches(':popover-open')) {
      panel.showPopover();
    }
    const view = this.document.defaultView;
    const placement = placeTip(
      anchor.getBoundingClientRect(),
      { width: panel.offsetWidth, height: panel.offsetHeight },
      { width: view?.innerWidth ?? 0, height: view?.innerHeight ?? 0 },
    );
    panel.style.top = `${placement.top}px`;
    panel.style.left = `${placement.left}px`;
  }

  /** Hides the tip if `anchor` still owns it (a newer tip may have replaced it). */
  public hide(anchor: Element): void {
    if (this.panel && this.owner === anchor && this.panel.matches(':popover-open')) {
      this.panel.hidePopover();
      this.owner = null;
    }
  }

  private ensurePanel(): HTMLElement {
    if (!this.panel) {
      const panel = this.document.createElement('div');
      panel.setAttribute('popover', 'manual');
      panel.setAttribute('role', 'tooltip');
      panel.className = PANEL_CLASS;
      this.document.body.appendChild(panel);
      this.panel = panel;
    }
    return this.panel;
  }

  private render(content: HoverTipContent): Node[] {
    const nodes: Node[] = [this.element('p', TITLE_CLASS, content.title)];
    if (content.text) {
      nodes.push(this.element('p', 'm-0', content.text));
    }
    if (content.lines?.length) {
      const table = this.document.createElement('table');
      table.className = 'mt-2 w-full';
      for (const line of content.lines) {
        const row = this.document.createElement('tr');
        row.className = 'border-t border-edge';
        row.append(
          this.element('td', LABEL_CLASS, line.label),
          this.element('td', VALUE_CLASS, line.value),
        );
        table.appendChild(row);
      }
      nodes.push(table);
    }
    if (content.note) {
      nodes.push(this.element('p', 'm-0 mt-2 text-sm text-text-muted', content.note));
    }
    return nodes;
  }

  private element(tag: string, className: string, text: string): HTMLElement {
    const node = this.document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
  }
}
