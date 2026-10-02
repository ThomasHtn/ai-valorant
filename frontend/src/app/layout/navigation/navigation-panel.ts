import { Service, signal } from '@angular/core';

/** Open state of the navigation drawer on small screens, shared by the rail and the page header. */
@Service()
export class NavigationPanel {
  public readonly panelId = 'sidebar-panel';

  private readonly openState = signal(false);
  public readonly isOpen = this.openState.asReadonly();

  /** Element that opened the drawer, to give focus back to on close. */
  private trigger: HTMLElement | null = null;

  public open(trigger: HTMLElement): void {
    this.trigger = trigger;
    this.openState.set(true);
  }

  public close(): void {
    if (!this.openState()) {
      return;
    }
    this.openState.set(false);
    if (this.trigger?.isConnected) {
      this.trigger.focus();
    }
  }
}
