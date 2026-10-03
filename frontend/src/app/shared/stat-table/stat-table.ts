import { DOCUMENT } from '@angular/common';
import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { StatColumn, StatRow, StatTable } from '@core/report/stat-table.model';
import { columnReference } from '@core/report/tone.utils';
import { BetterHint } from '@shared/better-hint/better-hint';
import { RowArt } from '@shared/game-art/row-art';
import { InfoTip } from '@shared/info-tip/info-tip';
import { placeTip } from '@shared/info-tip/info-tip-position.utils';

import { CELL_TIP_DELAY_MS, TONE_CLASSES } from './stat-table.constants';
import { CellView, StatCellClick, StatDisplay, StatSort } from './stat-table.model';
import { buildRowViews, cellTipLines, nextSort } from './stat-table.utils';

/** The cell under the pointer or the keyboard, whose tip is open. */
interface HoveredCell {
  row: StatRow;
  view: CellView;
}

/**
 * A coloured statistics table of the Tableaux view (any `StatTable` from the API).
 *
 * - A picture column aligns the rows (map, agent, weapon, role; players by their avatar agent).
 * - Headers sort the rows (descending, ascending, API order); the total row stays last.
 * - Cells are coloured against the chosen reference, may show their sample and reference value,
 *   explain themselves in a tip (squad, top ranked, opponents, history with their samples) and
 *   emit `cellClick` so the page can open the rounds behind them.
 * - Wide tables scroll inside their own box, never the page.
 */
@Component({
  selector: 'app-stat-table',
  imports: [BetterHint, RowArt, InfoTip],
  templateUrl: './stat-table.html',
  host: { class: 'block min-w-0' },
})
export class StatTableView {
  public readonly table = input.required<StatTable>();
  /** Reference, colours and extra lines, usually the view's `ViewState.preferences()`. */
  public readonly display = input.required<StatDisplay>();
  /** Squad player name -> avatar agent, to draw player rows. */
  public readonly playerAgents = input<Record<string, string>>({});
  /** Keeps only the rows matching the scope filters; the total row always stays. */
  public readonly rowFilter = input<((row: StatRow) => boolean) | null>(null);

  public readonly cellClick = output<StatCellClick>();

  /** Back to the API's order whenever another table is shown. */
  protected readonly sort = linkedSignal<StatTable, StatSort | null>({
    source: this.table,
    computation: () => null,
  });
  protected readonly rows = computed(() =>
    buildRowViews(this.table(), this.display(), this.playerAgents(), this.rowFilter(), this.sort()),
  );
  protected readonly toneClasses = TONE_CLASSES;
  /** Columns coloured against the squad's history whatever the chosen reference (rounds won, pistols). */
  protected readonly historyColumns = computed(() => {
    const { reference, colours } = this.display();
    const keys = this.table()
      .columns.filter(
        (c) => colours && reference !== 'hist' && columnReference(c, reference) === 'hist',
      )
      .map((c) => c.key);
    return new Set(keys);
  });

  protected readonly hovered = signal<HoveredCell | null>(null);
  protected readonly tipLines = computed(() => {
    const hovered = this.hovered();
    return hovered?.view.cell
      ? cellTipLines(hovered.view.cell, hovered.view.column, this.display().reference)
      : [];
  });
  protected readonly tipNote = computed(() => {
    const view = this.hovered()?.view;
    if (!view?.tone) {
      return null;
    }
    if (view.tone === 'small') {
      return `Échantillon sous le minimum (${view.column.min}) : pas de couleur.`;
    }
    const band = view.column.format === 'pct' ? '3 points' : '5 %';
    return `Orange à moins de ${band} de la référence. Clic : rounds concernés.`;
  });

  private readonly tip = viewChild.required<ElementRef<HTMLElement>>('tip');
  private readonly document = inject(DOCUMENT);
  private timer: ReturnType<typeof setTimeout> | undefined;

  protected sortBy(column: StatColumn): void {
    this.sort.update((current) => nextSort(current, column.key));
  }

  protected sortState(column: StatColumn): 'ascending' | 'descending' | 'none' {
    const sort = this.sort();
    if (sort?.key !== column.key) {
      return 'none';
    }
    return sort.direction === 1 ? 'ascending' : 'descending';
  }

  protected open(row: StatRow, view: CellView): void {
    this.cellClick.emit({ table: this.table(), row, column: view.column });
  }

  protected showTip(event: Event, row: StatRow, view: CellView): void {
    if (!view.cell) {
      return;
    }
    const target = event.currentTarget as HTMLElement;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.hovered.set({ row, view });
      const panel = this.tip().nativeElement;
      if (!panel.matches(':popover-open')) {
        panel.showPopover();
      }
      // Measured once the content of the new cell is rendered.
      queueMicrotask(() => this.place(panel, target));
    }, CELL_TIP_DELAY_MS);
  }

  protected hideTip(): void {
    clearTimeout(this.timer);
    const panel = this.tip().nativeElement;
    if (panel.matches(':popover-open')) {
      panel.hidePopover();
    }
    this.hovered.set(null);
  }

  private place(panel: HTMLElement, target: HTMLElement): void {
    const root = this.document.documentElement;
    const placement = placeTip(
      target.getBoundingClientRect(),
      { width: panel.offsetWidth, height: panel.offsetHeight },
      { width: root.clientWidth, height: root.clientHeight },
    );
    panel.style.top = `${placement.top}px`;
    panel.style.left = `${placement.left}px`;
  }
}
